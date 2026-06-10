-- =============================================================================
-- NOTIFICATIONS — incremental migration (chạy trên Supabase SQL Editor)
-- Phục vụ: trang / thông báo FE + API BE /api/v1/notifications
--
-- CÁCH CHẠY:
--   1. Mở file → Ctrl+A (chọn HẾT) → Run — KHÔNG chỉ chạy 1 đoạn
--   2. Nếu lỗi "relation notifications does not exist":
--      → Chạy trước add_notifications_step1_table.sql
--      → Rồi chạy lại file này
--   3. Kiểm tra: SELECT * FROM public.notifications LIMIT 1;
--
-- Nội dung:
--   • Enum level (info/success/warning/error) — map FE AppNotificationType
--   • Enum category (subscription, wallet, order, asset, admin, account, ai)
--   • Bảng notifications + RLS
--   • Hàm create_notification() (SECURITY DEFINER — BE/trigger gọi)
--   • Trigger tự tạo thông báo: asset duyệt/từ chối, đơn hoàn tất, đơn CK chờ admin
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.notification_level AS ENUM ('info', 'success', 'warning', 'error');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.notification_category AS ENUM (
    'subscription',
    'wallet',
    'order',
    'asset',
    'admin',
    'account',
    'ai'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2. TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level           public.notification_level NOT NULL DEFAULT 'info',
  category        public.notification_category NOT NULL DEFAULT 'account',
  title           VARCHAR(200) NOT NULL,
  body            TEXT,
  action_url      TEXT,
  reference_type  VARCHAR(50),
  reference_id    UUID,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_reference
  ON public.notifications (reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. HELPER — tạo thông báo (BE hoặc trigger gọi)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id        UUID,
  p_level          public.notification_level,
  p_category       public.notification_category,
  p_title          VARCHAR(200),
  p_body           TEXT DEFAULT NULL,
  p_action_url     TEXT DEFAULT NULL,
  p_reference_type VARCHAR(50) DEFAULT NULL,
  p_reference_id   UUID DEFAULT NULL,
  p_metadata       JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'create_notification: user_id and title are required';
  END IF;

  INSERT INTO public.notifications (
    user_id, level, category, title, body,
    action_url, reference_type, reference_id, metadata
  )
  VALUES (
    p_user_id, p_level, p_category, p_title, p_body,
    p_action_url, p_reference_type, p_reference_id, COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Gửi cùng nội dung cho tất cả admin active
CREATE OR REPLACE FUNCTION public.create_admin_notifications(
  p_level          public.notification_level,
  p_category       public.notification_category,
  p_title          VARCHAR(200),
  p_body           TEXT DEFAULT NULL,
  p_action_url     TEXT DEFAULT NULL,
  p_reference_type VARCHAR(50) DEFAULT NULL,
  p_reference_id   UUID DEFAULT NULL,
  p_metadata       JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count INTEGER := 0;
  admin_row RECORD;
BEGIN
  FOR admin_row IN
    SELECT id FROM public.profiles
    WHERE role = 'admin'
      AND status = 'active'
      AND deleted_at IS NULL
  LOOP
    PERFORM public.create_notification(
      admin_row.id, p_level, p_category, p_title, p_body,
      p_action_url, p_reference_type, p_reference_id, p_metadata
    );
    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN inserted_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. TRIGGERS — tự sinh thông báo từ sự kiện nghiệp vụ
-- -----------------------------------------------------------------------------

-- 4a. Asset được duyệt / từ chối → thông báo uploader
CREATE OR REPLACE FUNCTION public.notify_asset_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    PERFORM public.create_notification(
      NEW.uploader_id,
      'success',
      'asset',
      'Asset đã được duyệt',
      format('"%s" đã được phê duyệt và hiển thị trên Marketplace.', NEW.title),
      '/marketplace',
      'asset',
      NEW.id,
      jsonb_build_object('asset_slug', NEW.slug, 'asset_title', NEW.title)
    );
  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    PERFORM public.create_notification(
      NEW.uploader_id,
      'warning',
      'asset',
      'Asset bị từ chối',
      COALESCE(
        NULLIF(NEW.rejection_reason, ''),
        format('"%s" chưa đạt yêu cầu duyệt. Vui lòng chỉnh sửa và gửi lại.', NEW.title)
      ),
      '/add-asset',
      'asset',
      NEW.id,
      jsonb_build_object('asset_slug', NEW.slug, 'rejection_reason', NEW.rejection_reason)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_asset_status_change ON public.assets;
CREATE TRIGGER trg_notify_asset_status_change
  AFTER UPDATE OF status ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_asset_status_change();

-- 4b. Đơn hàng hoàn tất → thông báo khách
CREATE OR REPLACE FUNCTION public.notify_order_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_name TEXT;
  notif_title TEXT;
  notif_body TEXT;
  notif_url TEXT;
  notif_category public.notification_category;
BEGIN
  IF TG_OP <> 'UPDATE' OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT oi.item_name INTO item_name
  FROM public.order_items oi
  WHERE oi.order_id = NEW.id
  ORDER BY oi.created_at
  LIMIT 1;

  item_name := COALESCE(item_name, NEW.order_code);

  IF NEW.order_type = 'asset' THEN
    notif_category := 'order';
    notif_title := 'Mua asset thành công';
    notif_body := format('Đơn %s · %s đã hoàn tất. Xem trong Thư viện của tôi.', NEW.order_code, item_name);
    notif_url := '/my-assets';
  ELSIF NEW.order_type = 'subscription' THEN
    notif_category := 'subscription';
    notif_title := 'Kích hoạt gói thành công';
    notif_body := format('Gói %s đã được kích hoạt (đơn %s).', item_name, NEW.order_code);
    notif_url := '/pricing';
  ELSIF NEW.order_type = 'credit_pack' THEN
    notif_category := 'wallet';
    notif_title := 'Nạp xu thành công';
    notif_body := format('Gói %s đã được cộng vào ví (đơn %s).', item_name, NEW.order_code);
    notif_url := '/profile';
  ELSE
    notif_category := 'order';
    notif_title := 'Đơn hàng hoàn tất';
    notif_body := format('Đơn %s đã được xử lý.', NEW.order_code);
    notif_url := '/my-orders';
  END IF;

  PERFORM public.create_notification(
    NEW.user_id,
    'success',
    notif_category,
    notif_title,
    notif_body,
    notif_url,
    'order',
    NEW.id,
    jsonb_build_object('order_code', NEW.order_code, 'order_type', NEW.order_type)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_order_completed ON public.orders;
CREATE TRIGGER trg_notify_order_completed
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_completed();

-- 4c. Đơn subscription / credit_pack pending → thông báo admin (chuyển khoản)
CREATE OR REPLACE FUNCTION public.notify_admin_pending_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer_name TEXT;
  item_name TEXT;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  IF NEW.order_type NOT IN ('subscription', 'credit_pack') THEN
    RETURN NEW;
  END IF;

  SELECT p.name INTO buyer_name
  FROM public.profiles p
  WHERE p.id = NEW.user_id;

  SELECT oi.item_name INTO item_name
  FROM public.order_items oi
  WHERE oi.order_id = NEW.id
  ORDER BY oi.created_at
  LIMIT 1;

  buyer_name := COALESCE(buyer_name, 'Khách hàng');
  item_name := COALESCE(
    item_name,
    CASE WHEN NEW.order_type = 'subscription' THEN 'Gói đăng ký' ELSE 'Gói nạp xu' END
  );

  PERFORM public.create_admin_notifications(
    'warning',
    'admin',
    CASE WHEN NEW.order_type = 'subscription'
      THEN 'Đơn mua gói chờ xác nhận'
      ELSE 'Đơn nạp xu chờ xác nhận'
    END,
    format(
      '%s · %s · %s · %sđ. Vào Admin → Đơn hàng để xác nhận.',
      buyer_name,
      item_name,
      NEW.order_code,
      to_char(NEW.total_vnd, 'FM999G999G999')
    ),
    '/admin',
    'order',
    NEW.id,
    jsonb_build_object(
      'order_code', NEW.order_code,
      'order_type', NEW.order_type,
      'total_vnd', NEW.total_vnd,
      'user_id', NEW.user_id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_pending_order ON public.orders;
CREATE TRIGGER trg_notify_admin_pending_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_pending_order();

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- INSERT chỉ qua SECURITY DEFINER (create_notification) hoặc service role — không cho client tự insert

-- -----------------------------------------------------------------------------
-- 6. (Tuỳ chọn) Dọn thông báo đã đọc > 90 ngày — chạy bằng pg_cron hoặc thủ công
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(p_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE read_at IS NOT NULL
    AND read_at < NOW() - (p_days || ' days')::interval;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- DONE
-- -----------------------------------------------------------------------------
SELECT 'Notifications schema deployed successfully!' AS status;

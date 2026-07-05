-- Chỉ thông báo admin khi khách bấm "Tôi đã chuyển khoản" (metadata.userReportedTransferAt),
-- không thông báo ngay khi tạo đơn pending.

DROP TRIGGER IF EXISTS trg_notify_admin_pending_order ON public.orders;

CREATE OR REPLACE FUNCTION public.notify_admin_pending_order_on_transfer_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer_name TEXT;
  item_name TEXT;
  ord public.orders%ROWTYPE;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF NEW.metadata IS NULL OR NEW.metadata = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  IF NOT (NEW.metadata ? 'userReportedTransferAt') THEN
    RETURN NEW;
  END IF;

  IF OLD.metadata ? 'userReportedTransferAt' THEN
    RETURN NEW;
  END IF;

  IF NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO ord FROM public.orders WHERE id = NEW.order_id;
  IF NOT FOUND OR ord.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  IF ord.order_type NOT IN ('subscription', 'credit_pack') THEN
    RETURN NEW;
  END IF;

  SELECT p.name INTO buyer_name
  FROM public.profiles p
  WHERE p.id = ord.user_id;

  SELECT oi.item_name INTO item_name
  FROM public.order_items oi
  WHERE oi.order_id = ord.id
  ORDER BY oi.created_at
  LIMIT 1;

  buyer_name := COALESCE(buyer_name, 'Khách hàng');
  item_name := COALESCE(
    item_name,
    CASE WHEN ord.order_type = 'subscription' THEN 'Gói đăng ký' ELSE 'Gói nạp xu' END
  );

  PERFORM public.create_admin_notifications(
    'warning',
    'admin',
    CASE WHEN ord.order_type = 'subscription'
      THEN 'Đơn mua gói chờ xác nhận'
      ELSE 'Đơn nạp xu chờ xác nhận'
    END,
    format(
      '%s · %s · %s · %sđ. Khách đã báo chuyển khoản — vào Admin → Đơn hàng để xác nhận.',
      buyer_name,
      item_name,
      ord.order_code,
      to_char(ord.total_vnd, 'FM999G999G999')
    ),
    '/admin?tab=orders',
    'order',
    ord.id,
    jsonb_build_object(
      'order_code', ord.order_code,
      'order_type', ord.order_type,
      'total_vnd', ord.total_vnd,
      'user_id', ord.user_id,
      'transfer_reported_at', NEW.metadata->>'userReportedTransferAt'
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_pending_order_on_transfer_report ON public.payments;
CREATE TRIGGER trg_notify_admin_pending_order_on_transfer_report
  AFTER UPDATE OF metadata ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_pending_order_on_transfer_report();

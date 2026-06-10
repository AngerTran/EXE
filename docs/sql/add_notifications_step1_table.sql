-- BƯỚC 1 — Chạy file này TRƯỚC (tạo enum + bảng)
-- Supabase SQL Editor → copy TOÀN BỘ file → Run
-- Sau khi OK, chạy tiếp add_notifications.sql (hoặc add_notifications_step2_functions.sql)

DO $$
BEGIN
  CREATE TYPE public.notification_level AS ENUM ('info', 'success', 'warning', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.notification_category AS ENUM (
    'subscription', 'wallet', 'order', 'asset', 'admin', 'account', 'ai'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

-- Kiểm tra — phải trả về 1 dòng
SELECT 'notifications table OK' AS status,
       COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notifications';

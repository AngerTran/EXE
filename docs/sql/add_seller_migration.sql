-- =============================================================================
-- SELLER — Full migration (PostgreSQL / Supabase)
-- Một file duy nhất: role + mở rộng profiles + applications + earnings
-- Xem: docs/SELLER_ROLE_PLAN.md, docs/SELLER_ROLE_PROGRESS.md
--
-- CÁCH CHẠY (Supabase SQL Editor):
--   1) BLOCK 1 — chạy MỘT MÌNH (nếu chưa có enum seller). Restart BE sau đó.
--   2) BLOCK 2 — chạy TOÀN BỘ phần còn lại (một lần Run).
--   3) BLOCK 3 — wallet_tx_type: từng dòng, Run riêng (Phase 3, khi cần).
--   4) BLOCK 4 — cấp seller test (thay email, Run riêng).
-- =============================================================================


-- =============================================================================
-- BLOCK 1 — Enum user_role (chạy MỘT MÌNH nếu chưa chạy)
-- Lỗi 55P04 nếu gộp với SELECT/UPDATE dùng 'seller' cùng lúc.
-- =============================================================================
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'seller';


-- =============================================================================
-- BLOCK 2 — Phần chính (chạy SAU block 1, một lần Run toàn bộ từ đây đến hết)
-- =============================================================================

-- --- 2.1 Enum phụ ---
DO $$ BEGIN
  CREATE TYPE public.seller_status AS ENUM ('pending', 'active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.seller_application_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.seller_earning_status AS ENUM ('pending', 'available', 'paid_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- 2.2 Mở rộng profiles (không tạo bảng seller_profiles) ---
-- Dùng lại: name, username, avatar_url, role, status
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS seller_website_url TEXT,
  ADD COLUMN IF NOT EXISTS seller_is_trusted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS seller_status public.seller_status,
  ADD COLUMN IF NOT EXISTS seller_applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seller_approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_seller_storefront
  ON public.profiles (username)
  WHERE role = 'seller'
    AND deleted_at IS NULL
    AND seller_status = 'active';

UPDATE public.profiles
SET
  seller_status = 'active',
  seller_approved_at = COALESCE(seller_approved_at, updated_at, NOW()),
  updated_at = NOW()
WHERE role = 'seller'
  AND deleted_at IS NULL
  AND seller_status IS NULL;

-- --- 2.3 Đơn đăng ký seller (optional) ---
CREATE TABLE IF NOT EXISTS public.seller_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason            TEXT NOT NULL,
  portfolio_url     TEXT,
  status            public.seller_application_status NOT NULL DEFAULT 'pending',
  reviewed_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_seller_applications_one_pending_per_user;
CREATE UNIQUE INDEX idx_seller_applications_one_pending_per_user
  ON public.seller_applications (user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_seller_applications_status_created
  ON public.seller_applications (status, created_at DESC);

-- --- 2.4 Doanh thu seller (Phase 3) ---
CREATE TABLE IF NOT EXISTS public.seller_earnings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id          UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  asset_id          UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  gross_xu          INT NOT NULL CHECK (gross_xu >= 0),
  platform_fee_xu   INT NOT NULL CHECK (platform_fee_xu >= 0),
  net_xu            INT NOT NULL CHECK (net_xu >= 0),
  status            public.seller_earning_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seller_earnings_order_asset_unique UNIQUE (order_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller_created
  ON public.seller_earnings (seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_seller_earnings_status
  ON public.seller_earnings (status);

-- --- 2.5 Kiểm tra ---
SELECT unnest(enum_range(NULL::public.user_role)) AS role_value
ORDER BY role_value;

SELECT
  'profiles' AS check_name,
  COUNT(*) FILTER (WHERE role = 'seller') AS seller_count,
  COUNT(*) FILTER (WHERE role = 'seller' AND seller_status = 'active') AS active_sellers
FROM public.profiles
WHERE deleted_at IS NULL;

SELECT 'seller_applications' AS check_name, COUNT(*) AS row_count FROM public.seller_applications;
SELECT 'seller_earnings' AS check_name, COUNT(*) AS row_count FROM public.seller_earnings;


-- =============================================================================
-- BLOCK 3 — wallet_tx_type (BẮT BUỘC trước khi mua asset trả phí / seller nhận xu)
-- Chạy RIÊNG từng dòng trong SQL Editor nếu cần.
-- =============================================================================
ALTER TYPE public.wallet_tx_type ADD VALUE IF NOT EXISTS 'SELLER_SALE';
ALTER TYPE public.wallet_tx_type ADD VALUE IF NOT EXISTS 'SELLER_PAYOUT';


-- =============================================================================
-- BLOCK 4 — Cấp seller (thay email, chạy RIÊNG)
-- =============================================================================
-- UPDATE public.profiles
-- SET
--   role = 'seller',
--   seller_status = 'active',
--   seller_approved_at = NOW(),
--   updated_at = NOW()
-- WHERE email = 'your-seller@example.com'
--   AND deleted_at IS NULL;

-- SELECT id, email, username, role, seller_status, seller_approved_at
-- FROM public.profiles
-- WHERE email = 'your-seller@example.com';

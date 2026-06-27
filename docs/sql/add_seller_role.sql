-- Thêm role seller vào enum user_role (PostgreSQL / Supabase).
-- Chạy trong Supabase SQL Editor, sau đó restart BE (Npgsql cache enum).
-- Xem: docs/SELLER_ROLE_PLAN.md

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'seller';

-- Ví dụ: cấp quyền seller cho 1 user (thay email)
-- UPDATE public.profiles
-- SET role = 'seller', updated_at = now()
-- WHERE email = 'your-seller@example.com';

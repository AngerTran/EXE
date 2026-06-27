-- Fix lỗi mua asset: invalid input value for enum wallet_tx_type: "SELLER_SALE"
-- Chạy trong Supabase → SQL Editor (cả 2 dòng, từng dòng cũng được)

ALTER TYPE public.wallet_tx_type ADD VALUE IF NOT EXISTS 'SELLER_SALE';
ALTER TYPE public.wallet_tx_type ADD VALUE IF NOT EXISTS 'SELLER_PAYOUT';

-- Kiểm tra
SELECT unnest(enum_range(NULL::public.wallet_tx_type)) AS wallet_tx_type
ORDER BY wallet_tx_type;

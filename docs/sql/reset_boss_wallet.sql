-- =============================================================================
-- Reset ví + gói Pro cho tài khoản Boss (admin)
-- Chạy: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

DO $reset$
DECLARE
  boss_email      TEXT := 'tanhnse180506@fpt.edu.vn';
  -- Đổi số xu mong muốn tại đây (admin demo thường dùng 999)
  target_balance  INT  := 999;
  boss_user_id    UUID;
  wallet_row_id   UUID;
  old_balance     INT;
  delta           INT;
  pro_plan_id     UUID;
BEGIN
  SELECT id
  INTO boss_user_id
  FROM public.profiles
  WHERE email = boss_email
    AND deleted_at IS NULL
  LIMIT 1;

  IF boss_user_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy profile với email: %', boss_email;
  END IF;

  -- Giữ role admin
  UPDATE public.profiles
  SET role = 'admin',
      updated_at = NOW()
  WHERE id = boss_user_id
    AND role IS DISTINCT FROM 'admin';

  -- Ví: tạo mới hoặc cân bằng về target_balance
  SELECT w.id, w.balance
  INTO wallet_row_id, old_balance
  FROM public.wallets w
  WHERE w.user_id = boss_user_id;

  IF wallet_row_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance, updated_at)
    VALUES (boss_user_id, target_balance, NOW())
    RETURNING id INTO wallet_row_id;

    INSERT INTO public.wallet_transactions (
      wallet_id, type, amount, balance_after, description, reference_type
    )
    VALUES (
      wallet_row_id,
      'BONUS',
      target_balance,
      target_balance,
      'Khởi tạo ví Boss (admin reset)',
      'admin_reset'
    );
  ELSE
    delta := target_balance - old_balance;

    IF delta <> 0 THEN
      UPDATE public.wallets
      SET balance = target_balance,
          updated_at = NOW()
      WHERE id = wallet_row_id;

      INSERT INTO public.wallet_transactions (
        wallet_id, type, amount, balance_after, description, reference_type
      )
      VALUES (
        wallet_row_id,
        'BONUS',
        delta,
        target_balance,
        'Cân bằng ví Boss (admin reset)',
        'admin_reset'
      );
    END IF;
  END IF;

  -- Gói Pro active (hiển thị ∞ trên FE, tránh lỗi mua asset khi thiếu subscription)
  SELECT id
  INTO pro_plan_id
  FROM public.subscription_plans
  WHERE slug = 'pro'
  LIMIT 1;

  IF pro_plan_id IS NULL THEN
    RAISE NOTICE 'Chưa có plan slug=pro — bỏ qua bước subscription.';
  ELSIF NOT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = boss_user_id
      AND s.plan_id = pro_plan_id
      AND s.status = 'active'
  ) THEN
    UPDATE public.subscriptions
    SET status = 'cancelled',
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE user_id = boss_user_id
      AND status = 'active';

    INSERT INTO public.subscriptions (
      user_id, plan_id, status, started_at, created_at, updated_at
    )
    VALUES (
      boss_user_id, pro_plan_id, 'active', NOW(), NOW(), NOW()
    );
  END IF;

  RAISE NOTICE 'Done. user_id=% wallet=% xu', boss_user_id, target_balance;
END;
$reset$;


-- Kiểm tra kết quả
SELECT
  p.id,
  p.email,
  p.username,
  p.name,
  p.role,
  w.balance AS wallet_balance,
  sp.slug   AS active_plan,
  s.status  AS subscription_status
FROM public.profiles p
LEFT JOIN public.wallets w ON w.user_id = p.id
LEFT JOIN public.subscriptions s
  ON s.user_id = p.id AND s.status = 'active'
LEFT JOIN public.subscription_plans sp ON sp.id = s.plan_id
WHERE p.email = 'tanhnse180506@fpt.edu.vn';

SELECT wt.created_at, wt.type, wt.amount, wt.balance_after, wt.description
FROM public.wallet_transactions wt
JOIN public.wallets w ON w.id = wt.wallet_id
JOIN public.profiles p ON p.id = w.user_id
WHERE p.email = 'tanhnse180506@fpt.edu.vn'
ORDER BY wt.created_at DESC
LIMIT 5;

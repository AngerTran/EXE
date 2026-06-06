-- Supabase: tạo profile + wallet + gói free khi user đăng ký mới.
-- Chạy trong Supabase Dashboard → SQL Editor, hoặc: dotnet run --project BE/scripts/SetupNewUserTrigger

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  free_plan_id UUID;
  welcome_xu INT := 100;
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  base_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(NEW.email, '@', 1)
  );
  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, email, name, role, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', final_username),
    'customer',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.wallets WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT id, COALESCE(credits_monthly, 100)
  INTO free_plan_id, welcome_xu
  FROM public.subscription_plans
  WHERE slug = 'free'
  LIMIT 1;

  IF free_plan_id IS NULL THEN
    welcome_xu := 100;
  END IF;

  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, welcome_xu);

  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status, started_at)
    VALUES (NEW.id, free_plan_id, 'active', NOW());

    INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, description)
    SELECT w.id, 'BONUS', welcome_xu, welcome_xu, 'Xu chào mừng khi đăng ký'
    FROM public.wallets w WHERE w.user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: user Supabase đã có nhưng chưa có profile (đăng ký trước khi có trigger)
DO $backfill$
DECLARE
  r RECORD;
  free_plan_id UUID;
  welcome_xu INT := 100;
  base_username TEXT;
  final_username TEXT;
  suffix INT;
BEGIN
  SELECT id, COALESCE(credits_monthly, 100)
  INTO free_plan_id, welcome_xu
  FROM public.subscription_plans
  WHERE slug = 'free'
  LIMIT 1;

  FOR r IN
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.id IS NULL
  LOOP
    base_username := COALESCE(
      NULLIF(r.raw_user_meta_data->>'username', ''),
      split_part(r.email, '@', 1)
    );
    final_username := base_username;
    suffix := 0;

    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
      suffix := suffix + 1;
      final_username := base_username || suffix::TEXT;
    END LOOP;

    INSERT INTO public.profiles (id, username, email, name, role, avatar_url)
    VALUES (
      r.id,
      final_username,
      r.email,
      COALESCE(r.raw_user_meta_data->>'name', final_username),
      'customer',
      r.raw_user_meta_data->>'avatar_url'
    );

    IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE user_id = r.id) THEN
      INSERT INTO public.wallets (user_id, balance)
      VALUES (r.id, welcome_xu);

      IF free_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (user_id, plan_id, status, started_at)
        VALUES (r.id, free_plan_id, 'active', NOW());

        INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, description)
        SELECT w.id, 'BONUS', welcome_xu, welcome_xu, 'Xu chào mừng khi đăng ký'
        FROM public.wallets w WHERE w.user_id = r.id;
      END IF;
    END IF;
  END LOOP;
END;
$backfill$;

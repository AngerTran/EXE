/// Storage keys — mirror FE `api/client.ts` + `lib/supabase.ts`.
abstract final class AuthStorage {
  static const accessToken = 'exe_access_token';
  static const refreshToken = 'exe_refresh_token';
  static const rememberMe = 'exe_remember_me';
  static const supabaseSession = 'exe_supabase_auth';
}

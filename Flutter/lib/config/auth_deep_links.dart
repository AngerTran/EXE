/// Deep link URLs — bắt buộc thêm vào Supabase → Authentication → URL Configuration → Redirect URLs.
abstract final class AuthDeepLinks {
  static const scheme = 'vn.assetbox.app';
  static const oauthCallback = 'vn.assetbox.app://auth/callback';
  static const resetPassword = 'vn.assetbox.app://auth/reset';
}

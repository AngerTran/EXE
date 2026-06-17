/// Deep link URLs — bắt buộc thêm vào Supabase → Authentication → URL Configuration → Redirect URLs.
abstract final class AuthDeepLinks {
  static const scheme = 'vn.assetbox.app';
  static const oauthCallback = 'vn.assetbox.app://auth/callback';
  static const resetPassword = 'vn.assetbox.app://auth/reset';

  /// Windows desktop OAuth — Edge không cho redirect sang custom scheme, dùng loopback HTTP.
  static const windowsOAuthLoopbackPort = 42871;
  static const windowsOAuthLoopbackRedirect =
      'http://127.0.0.1:$windowsOAuthLoopbackPort/auth/callback';
}

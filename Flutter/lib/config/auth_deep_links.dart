/// Deep link URLs — bắt buộc thêm vào Supabase → Authentication → URL Configuration → Redirect URLs.
abstract final class AuthDeepLinks {
  static const scheme = 'vn.assetbox.app';
  static const oauthCallback = 'vn.assetbox.app://auth/callback';
  static const resetPassword = 'vn.assetbox.app://auth/reset';

  /// Windows desktop OAuth — Edge không cho redirect sang custom scheme, dùng loopback HTTP.
  static const windowsOAuthLoopbackPort = 42871;
  static const windowsOAuthLoopbackRedirect =
      'http://127.0.0.1:$windowsOAuthLoopbackPort/auth/callback';

  /// Redirect URLs cần khai báo trên Supabase (xem docs/FLUTTER_GOOGLE_OAUTH.md).
  static const supabaseRedirectUrls = <String>[
    oauthCallback,
    resetPassword,
    'http://localhost:5173/auth/callback',
    'http://localhost:5180/api/v1/auth/oauth-callback',
    'http://10.0.2.2:5180/api/v1/auth/oauth-callback',
    'http://localhost:5180/api/v1/auth/reset-callback',
    windowsOAuthLoopbackRedirect,
  ];
}

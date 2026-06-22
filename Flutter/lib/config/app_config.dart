import 'dart:io';

import 'auth_deep_links.dart';

/// Cấu hình API — mirror `VITE_API_BASE_URL` từ web FE.
class AppConfig {
  static const String appName = 'AssetBox';

  /// Override khi chạy:
  /// `flutter run --dart-define=API_BASE_URL=http://192.168.1.x:5180/api/v1`
  static const String _apiBaseOverride = String.fromEnvironment('API_BASE_URL');

  static const String _oauthRedirectOverride =
      String.fromEnvironment('OAUTH_REDIRECT_URL');

  static String get apiBaseUrl {
    if (_apiBaseOverride.isNotEmpty) return _apiBaseOverride;
    if (Platform.isAndroid) {
      // Android emulator → host machine
      return 'http://10.0.2.2:5180/api/v1';
    }
    return 'http://localhost:5180/api/v1';
  }

  /// OAuth redirect Supabase → app (mobile) hoặc loopback (desktop).
  ///
  /// Android/iOS: deep link trực tiếp `vn.assetbox.app://auth/callback` — chuẩn
  /// Supabase Flutter, không cần BE chạy lúc redirect (web FE/BE không đổi).
  /// Override BE bridge (dev): `--dart-define=OAUTH_REDIRECT_URL=http://10.0.2.2:5180/api/v1/auth/oauth-callback`
  static String get oauthRedirectUrl {
    if (_oauthRedirectOverride.isNotEmpty) return _oauthRedirectOverride;
    if (Platform.isWindows) {
      return AuthDeepLinks.windowsOAuthLoopbackRedirect;
    }
    if (Platform.isLinux || Platform.isMacOS) {
      return AuthDeepLinks.oauthCallback;
    }
    if (Platform.isAndroid || Platform.isIOS) {
      return AuthDeepLinks.oauthCallback;
    }
    return '$apiBaseUrl/auth/oauth-callback';
  }
}

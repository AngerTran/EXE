import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';
import '../config/auth_deep_links.dart';
import '../config/auth_storage.dart';
import 'auth_service.dart';

/// Google OAuth qua Supabase PKCE — mirror FE `lib/supabase.ts` + `AuthCallback.tsx`.
class SupabaseOAuthService {
  SupabaseOAuthService(this._authService);

  final AuthService _authService;
  bool _initialized = false;

  /// Preload Supabase client (FE gọi `getSupabase()` khi mở /auth).
  Future<void> warmUp() async {
    await _client();
  }

  Future<SupabaseClient> _client() async {
    if (!_initialized) {
      final config = await _authService.fetchSupabaseConfig();
      await Supabase.initialize(
        url: config.url,
        publishableKey: config.anonKey,
        authOptions: FlutterAuthClientOptions(
          authFlowType: AuthFlowType.pkce,
          autoRefreshToken: false,
          detectSessionInUri: Platform.isLinux || Platform.isMacOS,
          localStorage: SharedPreferencesLocalStorage(
            persistSessionKey: AuthStorage.supabaseSession,
          ),
          pkceAsyncStorage: SharedPreferencesGotrueAsyncStorage(),
        ),
      );
      _initialized = true;
    }
    return Supabase.instance.client;
  }

  /// Mở Google Sign-In. Trả về token khi hoàn tất; null nếu mobile chờ deep link.
  Future<({String accessToken, String? refreshToken})?> startGoogleSignIn() async {
    final client = await _client();
    if (Platform.isWindows) {
      return _startGoogleSignInWindowsLoopback(client);
    }
    return _startGoogleSignInDefault(client);
  }

  /// Windows: Edge chặn vn.assetbox.app:// — lắng nghe http://127.0.0.1:42871/auth/callback.
  Future<({String accessToken, String? refreshToken})?> _startGoogleSignInWindowsLoopback(
    SupabaseClient client,
  ) async {
    final redirectTo = AuthDeepLinks.windowsOAuthLoopbackRedirect;
    debugPrint('[OAuth] redirectTo=$redirectTo (windows loopback)');

    final callbackUri = Completer<Uri>();
    HttpServer? server;
    StreamSubscription<HttpRequest>? subscription;
    try {
      server = await HttpServer.bind(
        InternetAddress.loopbackIPv4,
        AuthDeepLinks.windowsOAuthLoopbackPort,
        shared: true,
      );
      subscription = server.listen((request) async {
        try {
          if (request.uri.path == '/favicon.ico') {
            request.response.statusCode = HttpStatus.noContent;
            await request.response.close();
            return;
          }
          if (request.uri.path != '/auth/callback') {
            request.response.statusCode = HttpStatus.notFound;
            await request.response.close();
            return;
          }

          if (!callbackUri.isCompleted) {
            callbackUri.complete(request.uri);
          }

          final body = utf8.encode(_oauthSuccessHtml);
          request.response
            ..statusCode = HttpStatus.ok
            ..headers.set('Content-Type', 'text/html; charset=utf-8')
            ..headers.contentLength = body.length
            ..add(body);
          await request.response.close();
        } catch (e) {
          debugPrint('[OAuth] loopback response error: $e');
        }
      });

      final launched = await client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: redirectTo,
        authScreenLaunchMode: LaunchMode.externalApplication,
        queryParams: const {'prompt': 'select_account'},
      );
      if (!launched) {
        throw Exception('Không mở được trình duyệt Google Sign-In');
      }

      final uri = await callbackUri.future.timeout(
        const Duration(minutes: 5),
        onTimeout: () => throw Exception(
          'Hết thời gian đăng nhập Google — thử lại.',
        ),
      );

      final oauthError = uri.queryParameters['error_description'] ??
          uri.queryParameters['error'];
      if (oauthError != null && oauthError.isNotEmpty) {
        throw Exception(oauthError.replaceAll('+', ' '));
      }

      final tokens = await completeOAuthUri(uri);
      // Đợi Edge nhận xong HTML trước khi đóng server.
      await Future<void>.delayed(const Duration(milliseconds: 400));
      return tokens;
    } finally {
      await subscription?.cancel();
      await server?.close();
    }
  }

  Future<({String accessToken, String? refreshToken})?> _startGoogleSignInDefault(
    SupabaseClient client,
  ) async {
    final redirectTo = AppConfig.oauthRedirectUrl;
    debugPrint('[OAuth] redirectTo=$redirectTo');

    final sessionCompleter = Completer<Session?>();
    late final StreamSubscription<AuthState> sub;
    sub = client.auth.onAuthStateChange.listen((data) {
      if (data.event == AuthChangeEvent.signedIn && data.session != null) {
        if (!sessionCompleter.isCompleted) {
          sessionCompleter.complete(data.session);
        }
      }
    });

    try {
      final launched = await client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: redirectTo,
        authScreenLaunchMode: LaunchMode.inAppBrowserView,
        queryParams: const {'prompt': 'select_account'},
      );
      if (!launched) {
        throw Exception('Không mở được trình duyệt Google Sign-In');
      }

      if (Platform.isAndroid || Platform.isIOS) return null;

      Session? session;
      try {
        session = await sessionCompleter.future.timeout(const Duration(seconds: 8));
      } on TimeoutException {
        session = client.auth.currentSession;
      }
      if (session == null || session.accessToken.isEmpty) return null;

      return (
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      );
    } finally {
      await sub.cancel();
    }
  }

  /// Mirror FE `AuthCallback` — chỉ exchange code tại callback, không auto-detect URL.
  Future<({String accessToken, String? refreshToken})> completeOAuthUri(
    Uri uri,
  ) async {
    final client = await _client();

    String? accessToken;
    String? refreshToken;

    final code = uri.queryParameters['code'];
    if (code != null && code.isNotEmpty) {
      final res = await client.auth.exchangeCodeForSession(code);
      accessToken = res.session.accessToken;
      refreshToken = res.session.refreshToken;
    } else {
      final session = client.auth.currentSession;
      accessToken = session?.accessToken;
      refreshToken = session?.refreshToken;
    }

    if (accessToken == null || accessToken.isEmpty) {
      final hash = uri.fragment;
      if (hash.isNotEmpty) {
        final params = Uri.splitQueryString(hash);
        accessToken = params['access_token'];
        refreshToken = params['refresh_token'];
        final err = params['error_description'] ?? params['error'];
        if (err != null) throw Exception(err.replaceAll('+', ' '));
      }
    }

    if (accessToken == null || accessToken.isEmpty) {
      throw Exception(
        'Không nhận được token từ Google — thử đăng nhập lại.',
      );
    }

    return (accessToken: accessToken, refreshToken: refreshToken);
  }

  Future<void> signOutLocal() async {
    if (!_initialized) return;
    try {
      await Supabase.instance.client.auth.signOut(scope: SignOutScope.local);
    } catch (_) {}
  }
}

const _oauthSuccessHtml = '''
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Đăng nhập thành công</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #131b2e; color: #dae2fd;
      display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  </style>
</head>
<body>
  <p>Đăng nhập Google thành công. Bạn có thể đóng tab này và quay lại AssetBox.</p>
</body>
</html>
''';

String oauthErrorMessage(Object error) {
  final message = error.toString().replaceFirst('Exception: ', '');
  if (message.contains('Code verifier could not be found') ||
      message.contains('PKCE code verifier not found')) {
    return 'Phiên đăng nhập Google hết hạn hoặc bị trùng. '
        'Quay lại /auth và thử đăng nhập Google lại.';
  }
  return message;
}

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';
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
          detectSessionInUri: false,
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

  /// Mở Chrome/Google account chooser — giống web (luôn hiện danh sách tài khoản).
  Future<void> startGoogleSignIn() async {
    final client = await _client();
    final redirectTo = AppConfig.oauthRedirectUrl;
    debugPrint('[OAuth] redirectTo=$redirectTo');
    final launched = await client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: redirectTo,
      authScreenLaunchMode: LaunchMode.externalApplication,
      queryParams: const {'prompt': 'select_account'},
    );
    if (!launched) {
      throw Exception('Không mở được trình duyệt Google Sign-In');
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

String oauthErrorMessage(Object error) {
  final message = error.toString().replaceFirst('Exception: ', '');
  if (message.contains('Code verifier could not be found') ||
      message.contains('PKCE code verifier not found')) {
    return 'Phiên đăng nhập Google hết hạn hoặc bị trùng. '
        'Quay lại /auth và thử đăng nhập Google lại.';
  }
  return message;
}

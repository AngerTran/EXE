import 'package:dio/dio.dart';

import '../models/auth_models.dart';
import 'api_client.dart';

class AuthService {
  AuthService(this._client);

  final ApiClient _client;

  Future<AuthSessionResponse> login(
    String email,
    String password, {
    bool rememberMe = true,
  }) async {
    final res = await _client.post<Map<String, dynamic>>(
      '/auth/login',
      auth: false,
      data: {'email': email, 'password': password},
      parser: (d) => d as Map<String, dynamic>,
    );
    final session = AuthSessionResponse.fromJson(res);
    if (session.accessToken != null) {
      await _client.setTokens(
        accessToken: session.accessToken!,
        refreshToken: session.refreshToken,
        rememberMe: rememberMe,
      );
    }
    return session;
  }

  Future<AuthSessionResponse> register(
    String email,
    String password,
    String name,
  ) async {
    final res = await _client.post<Map<String, dynamic>>(
      '/auth/register',
      auth: false,
      data: {'email': email, 'password': password, 'name': name},
      parser: (d) => d as Map<String, dynamic>,
    );
    final session = AuthSessionResponse.fromJson(res);
    if (session.accessToken != null) {
      await _client.setTokens(
        accessToken: session.accessToken!,
        refreshToken: session.refreshToken,
        rememberMe: true,
      );
    }
    return session;
  }

  Future<void> applySessionTokens(
    String accessToken, {
    String? refreshToken,
    bool rememberMe = true,
  }) =>
      _client.setTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
        rememberMe: rememberMe,
      );

  Future<void> logout() async {
    try {
      await _client.post<void>('/auth/logout');
    } catch (_) {
      // Token hết hạn vẫn xóa local
    }
    await _client.clearTokens();
  }

  Future<MeResponse> fetchMe() => _client.get(
        '/auth/me',
        parser: (d) => MeResponse.fromJson(d as Map<String, dynamic>),
      );

  Future<MeResponse> updateProfile({
    String? name,
    String? avatarUrl,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (avatarUrl != null) body['avatarUrl'] = avatarUrl;
    return _client.patch(
      '/auth/me',
      data: body,
      parser: (d) => MeResponse.fromJson(d as Map<String, dynamic>),
    );
  }

  Future<void> forgotPassword(String email) => _client.post<void>(
        '/auth/forgot-password',
        auth: false,
        data: {'email': email.trim()},
      );

  Future<void> resetPassword(String accessToken, String password) =>
      _client.post<void>(
        '/auth/reset-password',
        auth: false,
        data: {'accessToken': accessToken, 'password': password},
      );

  Future<SupabasePublicConfig> fetchSupabaseConfig() => _client.get(
        '/auth/config',
        auth: false,
        parser: (d) =>
            SupabasePublicConfig.fromJson(d as Map<String, dynamic>),
      );

  Future<MeResponse> uploadAvatar({
    required String fileName,
    required String contentType,
    required int fileSizeBytes,
    required List<int> bytes,
  }) async {
    final meta = await _client.post<Map<String, dynamic>>(
      '/auth/me/avatar/upload-url',
      data: {
        'fileName': fileName,
        'contentType': contentType,
        'fileSizeBytes': fileSizeBytes,
      },
      parser: (d) => d as Map<String, dynamic>,
    );
    final upload = UploadUrlResponse.fromJson(meta);

    final put = await Dio().put(
      upload.uploadUrl,
      data: bytes,
      options: Options(
        headers: {'Content-Type': contentType},
        validateStatus: (s) => s != null && s < 500,
      ),
    );

    if (put.statusCode != 200 && put.statusCode != 201) {
      throw Exception(
        put.statusCode == 403 || put.statusCode == 401
            ? 'Upload avatar thất bại — kiểm tra Supabase Storage.'
            : 'Upload avatar thất bại (${put.statusCode})',
      );
    }

    return _client.post(
      '/auth/me/avatar',
      data: {'storagePath': upload.storagePath},
      parser: (d) => MeResponse.fromJson(d as Map<String, dynamic>),
    );
  }
}

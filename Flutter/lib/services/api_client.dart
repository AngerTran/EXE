import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/auth_storage.dart';
import '../config/app_config.dart';
import '../models/common_models.dart';

class ApiClient {
  ApiClient(this._prefs) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 90),
        headers: {'Accept': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (options.extra['auth'] != false) {
            final token = _prefs.getString(_accessTokenKey);
            if (token != null && token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
      ),
    );
  }

  static const _accessTokenKey = AuthStorage.accessToken;
  static const _refreshTokenKey = AuthStorage.refreshToken;
  static const _rememberMeKey = AuthStorage.rememberMe;

  final SharedPreferences _prefs;
  late final Dio _dio;

  String? get accessToken => _prefs.getString(_accessTokenKey);

  bool get rememberMe => _prefs.getBool(_rememberMeKey) ?? false;

  static Future<bool> readRememberMePreference() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(AuthStorage.rememberMe) ?? false;
  }

  Future<void> setTokens({
    required String accessToken,
    String? refreshToken,
    bool rememberMe = true,
  }) async {
    await clearTokens();
    await _prefs.setBool(_rememberMeKey, rememberMe);
    await _prefs.setString(_accessTokenKey, accessToken);
    if (refreshToken != null) {
      await _prefs.setString(_refreshTokenKey, refreshToken);
    }
  }

  Future<void> clearTokens() async {
    await _prefs.remove(_accessTokenKey);
    await _prefs.remove(_refreshTokenKey);
  }

  /// Gọi khi khởi động app — nếu user không chọn "ghi nhớ" thì xóa token.
  Future<void> enforceRememberMePolicy() async {
    if (!rememberMe) {
      await clearTokens();
    }
  }

  Future<T> get<T>(
    String path, {
    bool auth = true,
    T Function(dynamic)? parser,
  }) =>
      _request('GET', path, auth: auth, parser: parser);

  Future<T> post<T>(
    String path, {
    Object? data,
    bool auth = true,
    T Function(dynamic)? parser,
  }) =>
      _request('POST', path, data: data, auth: auth, parser: parser);

  Future<T> patch<T>(
    String path, {
    Object? data,
    bool auth = true,
    T Function(dynamic)? parser,
  }) =>
      _request('PATCH', path, data: data, auth: auth, parser: parser);

  Future<void> delete<T>(
    String path, {
    bool auth = true,
    T Function(dynamic)? parser,
  }) =>
      _request('DELETE', path, auth: auth, parser: parser);

  Future<List<int>> downloadBytes(String path) async {
    try {
      final response = await _dio.get<List<int>>(
        path,
        options: Options(
          responseType: ResponseType.bytes,
          extra: {'auth': true},
        ),
      );
      return response.data ?? [];
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<T> _request<T>(
    String method,
    String path, {
    Object? data,
    bool auth = true,
    T Function(dynamic)? parser,
  }) async {
    try {
      final response = await _dio.request<dynamic>(
        path,
        data: data,
        options: Options(
          method: method,
          extra: {'auth': auth},
          contentType: Headers.jsonContentType,
        ),
      );

      if (response.statusCode == 204 || response.data == null) {
        return (parser?.call(null) ?? null) as T;
      }

      final body = response.data;
      if (parser != null) return parser(body);
      return body as T;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  ApiException _mapError(DioException e) {
    final status = e.response?.statusCode ?? 0;
    final data = e.response?.data;
    String message = e.message ?? 'Request failed';

    if (data is Map<String, dynamic>) {
      message = data['message'] as String? ??
          data['title'] as String? ??
          message;
      final errors = data['errors'];
      if (errors is Map<String, dynamic>) {
        final parts = <String>[];
        errors.forEach((field, value) {
          if (value is List) {
            for (final m in value) {
              parts.add('$field: $m');
            }
          }
        });
        if (parts.isNotEmpty) message = parts.join('; ');
      }
      return ApiException(
        message,
        status: status,
        code: data['code'] as String?,
      );
    }

    return ApiException(message, status: status);
  }
}

final apiClientProvider = FutureProvider<ApiClient>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  return ApiClient(prefs);
});

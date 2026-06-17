import 'package:dio/dio.dart';

/// Chuyển lỗi kỹ thuật sang thông báo thân thiện cho người dùng.
String friendlyErrorMessage(Object error) {
  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Kết nối quá lâu. Kiểm tra mạng và thử lại.';
      case DioExceptionType.connectionError:
        return 'Không kết nối được máy chủ. Hãy chắc backend đang chạy.';
      case DioExceptionType.badResponse:
        final code = error.response?.statusCode;
        if (code == 401) return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        if (code == 403) return 'Bạn không có quyền thực hiện thao tác này.';
        if (code == 404) return 'Không tìm thấy dữ liệu.';
        if (code != null && code >= 500) return 'Máy chủ đang gặp sự cố. Thử lại sau.';
        return 'Yêu cầu không thành công ($code).';
      default:
        break;
    }
  }
  final msg = error.toString();
  if (msg.contains('Connection failed') ||
      msg.contains('SocketException') ||
      msg.contains('Failed host lookup')) {
    return 'Không kết nối được máy chủ. Kiểm tra mạng hoặc backend.';
  }
  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

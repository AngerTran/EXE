import '../core/utils/error_messages.dart';
import '../models/common_models.dart';

String authErrorMessage(Object error, [String fallback = 'Đã xảy ra lỗi']) {
  if (error is ApiException) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'Email hoặc mật khẩu không đúng';
      case 'email_already_exists':
        return 'Email đã được sử dụng';
      case 'rate_limit_exceeded':
        return 'Quá nhiều lần thử — vui lòng đợi vài phút';
      case 'account_banned':
        return 'Tài khoản đã bị khóa';
      case 'configuration_error':
        return 'Hệ thống chưa được cấu hình đầy đủ. Vui lòng thử lại sau.';
      case 'profile_not_found':
        return 'Tài khoản Google chưa có profile — chạy trigger handle_new_user trên Supabase hoặc liên hệ admin';
      case 'validation_error':
        return error.message;
      default:
        return error.message.isNotEmpty ? error.message : fallback;
    }
  }
  return friendlyErrorMessage(error);
}

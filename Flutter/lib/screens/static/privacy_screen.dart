import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bảo mật')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Chính Sách Bảo Mật',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          Text(
            'Cập nhật: 24/03/2026',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.mutedForeground,
                ),
          ),
          const SizedBox(height: 20),
          ..._sections.map(
            (s) => Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          )),
                  const SizedBox(height: 8),
                  Text(s.body,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.mutedForeground,
                            height: 1.5,
                          )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Section {
  const _Section(this.title, this.body);
  final String title;
  final String body;
}

const _sections = [
  _Section(
    '1. Dữ liệu thu thập',
    'Chúng tôi thu thập email, tên hiển thị, lịch sử giao dịch, phiên AI và asset đã mua để vận hành dịch vụ.',
  ),
  _Section(
    '2. Mục đích sử dụng',
    'Dữ liệu dùng để xác thực tài khoản, xử lý thanh toán, cung cấp AI và hỗ trợ khách hàng.',
  ),
  _Section(
    '3. Lưu trữ & bảo mật',
    'Dữ liệu lưu trên hạ tầng Supabase và máy chủ AssetBox với mã hóa truyền tải HTTPS. Mật khẩu được hash, không lưu dạng plain text.',
  ),
  _Section(
    '4. Chia sẻ với bên thứ ba',
    'Chúng tôi dùng Supabase (auth), Google (đăng nhập OAuth) và ngân hàng (xác nhận chuyển khoản). Không bán dữ liệu cá nhân.',
  ),
  _Section(
    '5. Quyền của bạn',
    'Bạn có thể yêu cầu xóa tài khoản, xuất dữ liệu hoặc chỉnh sửa thông tin qua email support@assetbox.vn.',
  ),
];

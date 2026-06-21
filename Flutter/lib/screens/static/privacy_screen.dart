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
            'Cập nhật: 06/06/2026',
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
    'Email, tên hiển thị, avatar (Supabase Auth / Google OAuth), gói subscription, số dư xu, đơn hàng chuyển khoản, phiên & tin nhắn AI, asset đã mua/đăng, đánh giá, form liên hệ và thông báo. Không lưu số thẻ.',
  ),
  _Section(
    '2. Mục đích sử dụng',
    'Vận hành marketplace, ví xu, AI advisor, xử lý đơn chuyển khoản, kiểm duyệt, hỗ trợ khách hàng và thống kê nội bộ. Không dùng chat để huấn luyện mô hình AI riêng.',
  ),
  _Section(
    '3. Bảo mật',
    'Truyền tải HTTPS. Mật khẩu do Supabase quản lý. Token đăng nhập lưu trên thiết bị. Dữ liệu và file lưu trên Supabase.',
  ),
  _Section(
    '4. Bên thứ ba',
    'Supabase (DB, auth, storage), Google (OAuth), OpenAI (xử lý AI), nhà cung cấp hosting (API/frontend). Không bán dữ liệu cá nhân.',
  ),
  _Section(
    '5. Cookie & lưu trữ cục bộ',
    'Token phiên và tùy chọn giao diện. Không dùng Google Analytics hay cookie quảng cáo tại thời điểm cập nhật này.',
  ),
  _Section(
    '6. Quyền của bạn',
    'Chỉnh sửa hồ sơ trong Cài đặt. Yêu cầu xóa tài khoản hoặc truy cập dữ liệu qua support@assetbox.vn hoặc privacy@assetbox.vn.',
  ),
  _Section(
    '7. Liên hệ',
    'privacy@assetbox.vn hoặc support@assetbox.vn; form Liên hệ trong app.',
  ),
];

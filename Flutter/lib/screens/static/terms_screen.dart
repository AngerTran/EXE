import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Điều khoản')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Điều Khoản Sử Dụng',
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
    '1. Chấp nhận điều khoản',
    'Bằng việc sử dụng AssetBox (web hoặc app), bạn đồng ý các điều khoản này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.',
  ),
  _Section(
    '2. Dịch vụ',
    'AssetBox cung cấp: AI advisor (chat & outline game), marketplace asset (miễn phí/trả phí bằng xu), thư viện cá nhân, đánh giá, đăng tải asset (kiểm duyệt), gói subscription, gói nạp xu, thông báo trong app và form liên hệ hỗ trợ.',
  ),
  _Section(
    '3. Hệ thống xu',
    'Mỗi tin nhắn AI tiêu tốn 1 xu (trừ gói không giới hạn). Tài khoản mới được tặng 100 xu. Asset trả phí mua bằng xu trong ví. Xu không quy đổi tiền mặt và không chuyển nhượng.',
  ),
  _Section(
    '4. Gói & thanh toán',
    'Gói FREE, STUDENT và PRO — chi tiết tại Bảng giá. Subscription và gói nạp xu thanh toán bằng chuyển khoản; đơn được admin xác nhận thủ công. Không thu thập thẻ tín dụng. Không hoàn tiền gói đã kích hoạt, trừ lỗi hệ thống.',
  ),
  _Section(
    '5. Bản quyền',
    'Asset thuộc người đăng tải; bạn nhận license theo mô tả từng asset. Không phân phối lại nếu license không cho phép. Gợi ý AI mang tính tham khảo. Nội dung đăng tải phải hợp pháp.',
  ),
  _Section(
    '6. Trách nhiệm người dùng',
    'Dùng dịch vụ hợp pháp; không spam AI, gian lận thanh toán hay vi phạm bản quyền. Bảo mật tài khoản. Đánh giá trung thực.',
  ),
  _Section(
    '7. Giới hạn trách nhiệm',
    'Dịch vụ cung cấp "nguyên trạng". AssetBox không chịu trách nhiệm thiệt hại gián tiếp từ asset, gợi ý AI hoặc gián đoạn dịch vụ. Có thể đình chỉ tài khoản vi phạm.',
  ),
  _Section(
    '8. Liên hệ',
    'Email: support@assetbox.vn hoặc form Liên hệ trong app.',
  ),
];

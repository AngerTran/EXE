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
    '1. Chấp nhận điều khoản',
    'Bằng việc sử dụng AssetBox, bạn đồng ý tuân theo các điều khoản này. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.',
  ),
  _Section(
    '2. Dịch vụ',
    'AssetBox cung cấp AssetBox AI (tư vấn AI), Chợ Assets (tài nguyên game miễn phí/trả phí), và dịch vụ tư vấn chuyên gia cho gói INDIE/PRO.',
  ),
  _Section(
    '3. Hệ thống xu & gói dịch vụ',
    'Mỗi tin nhắn AI tiêu tốn xu theo chính sách hiện hành. Gói subscription cấp xu hàng tháng hoặc không giới hạn tùy gói. Asset trả phí được mua bằng VND qua chuyển khoản.',
  ),
  _Section(
    '4. Quyền sở hữu trí tuệ',
    'Asset trên marketplace thuộc quyền sở hữu người đăng tải. Bạn nhận license theo mô tả từng asset. Không được phân phối lại nếu license không cho phép.',
  ),
  _Section(
    '5. Giới hạn trách nhiệm',
    'AssetBox không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc sử dụng asset hoặc tư vấn AI. Dịch vụ được cung cấp "nguyên trạng".',
  ),
];

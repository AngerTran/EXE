import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/service_providers.dart';
import '../../widgets/common_widgets.dart';

class ContactScreen extends ConsumerStatefulWidget {
  const ContactScreen({super.key});

  @override
  ConsumerState<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends ConsumerState<ContactScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _gameIdea = TextEditingController();
  final _message = TextEditingController();
  String _consultType = 'basic';
  bool _loading = false;
  bool _sent = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _gameIdea.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty || _email.text.trim().isEmpty) {
      _snack('Nhập họ tên và email');
      return;
    }
    if (_message.text.trim().isEmpty) {
      _snack('Nhập nội dung tin nhắn');
      return;
    }
    setState(() => _loading = true);
    try {
      final svc = await ref.read(contactServiceProvider.future);
      await svc.submit(
        name: _name.text.trim(),
        email: _email.text.trim(),
        phone: _phone.text.trim(),
        gameIdea: _gameIdea.text.trim(),
        consultType: _consultType,
        message: _message.text.trim(),
      );
      setState(() {
        _loading = false;
        _sent = true;
      });
    } catch (e) {
      setState(() => _loading = false);
      _snack(e.toString());
    }
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.destructive),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Liên hệ')),
      body: _sent
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.check_circle_outline,
                        size: 56, color: AppColors.success),
                    const SizedBox(height: 16),
                    Text(
                      'Đã gửi yêu cầu',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Chúng tôi sẽ phản hồi qua email trong vòng 24h.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                  ],
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                SectionHeader(
                  title: 'Liên hệ AssetBox',
                  subtitle: 'support@assetbox.vn — phản hồi trong 24h',
                ),
                TextField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Họ tên *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'SĐT'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _gameIdea,
                  decoration: const InputDecoration(labelText: 'Ý tưởng game'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _consultType,
                  decoration: const InputDecoration(labelText: 'Loại tư vấn'),
                  items: const [
                    DropdownMenuItem(value: 'basic', child: Text('Cơ bản')),
                    DropdownMenuItem(value: 'premium', child: Text('Nâng cao')),
                    DropdownMenuItem(
                        value: 'expert', child: Text('Chuyên gia (INDIE/PRO)')),
                  ],
                  onChanged: (v) => setState(() => _consultType = v ?? 'basic'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _message,
                  minLines: 4,
                  maxLines: 8,
                  decoration: const InputDecoration(labelText: 'Tin nhắn *'),
                ),
                const SizedBox(height: 20),
                GradientCtaButton(
                  label: 'Gửi yêu cầu',
                  loading: _loading,
                  onPressed: _loading ? null : _submit,
                ),
              ],
            ),
    );
  }
}

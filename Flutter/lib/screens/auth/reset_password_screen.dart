import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/deep_link_state.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/service_providers.dart';
import '../../widgets/common_widgets.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key, this.initialUri});

  /// Deep link: `vn.assetbox.app://auth/reset#access_token=...&type=recovery`
  final Uri? initialUri;

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String? _accessToken;
  String? _pageError;
  bool _showPassword = false;
  bool _success = false;

  @override
  void initState() {
    super.initState();
    final uri = widget.initialUri ?? ref.read(deepLinkResetUriProvider);
    if (uri != null) {
      ref.read(deepLinkResetUriProvider.notifier).state = null;
    }
    _parseUri(uri);
  }

  void _parseUri(Uri? uri) {
    if (uri == null) {
      setState(() => _pageError =
          'Link đặt lại mật khẩu không hợp lệ. Yêu cầu gửi lại email.');
      return;
    }

    final params = <String, String>{...uri.queryParameters};
    if (uri.fragment.isNotEmpty) {
      params.addAll(Uri.splitQueryString(uri.fragment));
    }

    final error = params['error_description'] ?? params['error'];
    if (error != null) {
      setState(() => _pageError = error.replaceAll('+', ' '));
      return;
    }

    final token = params['access_token'];
    final type = params['type'];
    if (token != null && token.isNotEmpty && (type == null || type == 'recovery')) {
      setState(() => _accessToken = token);
      return;
    }

    setState(() => _pageError =
        'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
  }

  @override
  void dispose() {
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_accessToken == null) return;
    if (_password.text.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mật khẩu phải có ít nhất 6 ký tự')),
      );
      return;
    }
    if (_password.text != _confirm.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mật khẩu xác nhận không khớp')),
      );
      return;
    }

    final err = await ref
        .read(authProvider.notifier)
        .resetPassword(_accessToken!, _password.text);
    if (!mounted) return;
    if (err == null) {
      setState(() => _success = true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err), backgroundColor: AppColors.destructive),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(authProvider).isLoading;

    if (_pageError != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Đặt lại mật khẩu')),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.link_off, size: 48, color: AppColors.destructive),
                const SizedBox(height: 16),
                Text(_pageError!, textAlign: TextAlign.center),
                const SizedBox(height: 24),
                GradientCtaButton(
                  label: 'Quay lại đăng nhập',
                  expand: false,
                  onPressed: () => context.go('/auth'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_success) {
      return Scaffold(
        appBar: AppBar(title: const Text('Đặt lại mật khẩu')),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle_outline,
                    size: 56, color: AppColors.success),
                const SizedBox(height: 16),
                Text(
                  'Đặt lại mật khẩu thành công',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 24),
                GradientCtaButton(
                  label: 'Đăng nhập',
                  onPressed: () => context.go('/auth'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Đặt lại mật khẩu')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Mật khẩu mới',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Nhập mật khẩu mới cho tài khoản của bạn.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.mutedForeground,
                  ),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _password,
              obscureText: !_showPassword,
              decoration: InputDecoration(
                labelText: 'Mật khẩu mới',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(
                    _showPassword ? Icons.visibility_off : Icons.visibility,
                  ),
                  onPressed: () =>
                      setState(() => _showPassword = !_showPassword),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _confirm,
              obscureText: !_showPassword,
              decoration: const InputDecoration(
                labelText: 'Xác nhận mật khẩu',
                prefixIcon: Icon(Icons.lock_outline),
              ),
            ),
            const SizedBox(height: 24),
            GradientCtaButton(
              label: 'Cập nhật mật khẩu',
              loading: loading,
              onPressed: loading ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}

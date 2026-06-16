import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_assets.dart';
import '../../core/router/deep_link_state.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/service_providers.dart';
import '../../widgets/branded_background.dart';
import '../../widgets/common_widgets.dart';

/// Xử lý OAuth callback — mirror FE `AuthCallback.tsx`.
class AuthCallbackScreen extends ConsumerStatefulWidget {
  const AuthCallbackScreen({super.key});

  @override
  ConsumerState<AuthCallbackScreen> createState() => _AuthCallbackScreenState();
}

class _AuthCallbackScreenState extends ConsumerState<AuthCallbackScreen> {
  String? _error;
  bool _handled = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _complete());
  }

  Future<void> _complete() async {
    if (_handled) return;
    _handled = true;

    final uri = takeOAuthCallbackUri(ref);
    if (uri == null) {
      setState(() => _error = 'Không nhận được mã đăng nhập Google — thử lại.');
      return;
    }
    final hasCode = uri.queryParameters['code']?.isNotEmpty == true;
    if (!hasCode && uri.fragment.isEmpty) {
      setState(() => _error = 'Không nhận được mã đăng nhập Google — thử lại.');
      return;
    }

    final err = await ref.read(authProvider.notifier).completeOAuth(uri);
    if (!mounted) return;
    if (err == null) {
      context.go('/');
    } else {
      setState(() => _error = err);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        extendBodyBehindAppBar: true,
        body: AuthHeroBackground(
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline,
                      size: 48, color: AppColors.destructive),
                  const SizedBox(height: 16),
                  Text(
                    _error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.destructive),
                  ),
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
        ),
      );
    }

    return Scaffold(
      body: AuthHeroBackground(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(AppAssets.logoIcon, width: 56, height: 56),
              const SizedBox(height: 20),
              const CircularProgressIndicator(color: AppColors.primary),
              const SizedBox(height: 16),
              const Text('Đang hoàn tất đăng nhập Google...'),
            ],
          ),
        ),
      ),
    );
  }
}

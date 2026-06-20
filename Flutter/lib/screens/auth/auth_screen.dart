import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_assets.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../providers/service_providers.dart';
import '../../services/api_client.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/branded_background.dart';
import '../../widgets/common_widgets.dart';

enum AuthView { login, register, forgot }

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key, this.initialView = AuthView.login});

  final AuthView initialView;

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  late AuthView _view;
  final _loginEmail = TextEditingController();
  final _loginPassword = TextEditingController();
  final _regName = TextEditingController();
  final _regEmail = TextEditingController();
  final _regPassword = TextEditingController();
  final _forgotEmail = TextEditingController();
  bool _rememberMe = true;
  bool _showPassword = false;
  bool _forgotSent = false;
  bool _googleLoading = false;

  @override
  void initState() {
    super.initState();
    _view = widget.initialView;
    _loadRememberMe();
    _warmSupabase();
  }

  Future<void> _loadRememberMe() async {
    final remember = await ApiClient.readRememberMePreference();
    if (mounted) setState(() => _rememberMe = remember);
  }

  Future<void> _warmSupabase() async {
    try {
      final oauth = await ref.read(supabaseOAuthServiceProvider.future);
      await oauth.warmUp();
    } catch (_) {}
  }

  @override
  void dispose() {
    _loginEmail.dispose();
    _loginPassword.dispose();
    _regName.dispose();
    _regEmail.dispose();
    _regPassword.dispose();
    _forgotEmail.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final err = await ref.read(authProvider.notifier).login(
          _loginEmail.text.trim(),
          _loginPassword.text,
          rememberMe: _rememberMe,
        );
    if (!mounted) return;
    if (err == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return;
    } else {
      _showError(err);
    }
  }

  Future<void> _register() async {
    if (_regPassword.text.length < 6) {
      _showError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    final err = await ref.read(authProvider.notifier).register(
          _regEmail.text.trim(),
          _regPassword.text,
          _regName.text.trim(),
        );
    if (!mounted) return;
    if (err == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return;
    } else if (err.contains('xác nhận email')) {
      _showSuccess(err);
      setState(() => _view = AuthView.login);
    } else {
      _showError(err);
    }
  }

  Future<void> _forgot() async {
    final email = _forgotEmail.text.trim();
    if (email.isEmpty) {
      _showError('Nhập email của bạn');
      return;
    }
    final err = await ref.read(authProvider.notifier).forgotPassword(email);
    if (!mounted) return;
    if (err == null) {
      setState(() => _forgotSent = true);
    } else {
      _showError(err);
    }
  }

  Future<void> _google() async {
    setState(() => _googleLoading = true);
    try {
      final err = await ref.read(authProvider.notifier).loginWithGoogle();
      if (!mounted) return;
      if (err != null) {
        _showError(
          '$err\n\nThêm các URL sau vào Supabase → Authentication → Redirect URLs:\n'
          '• http://127.0.0.1:42871/auth/callback (Windows)\n'
          '• vn.assetbox.app://auth/callback\n'
          '• http://10.0.2.2:5180/api/v1/auth/oauth-callback',
        );
      } else if (ref.read(authProvider).isLoggedIn) {
        context.go('/');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Hoàn tất đăng nhập Google trong trình duyệt — app sẽ tự quay lại',
            ),
            duration: Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _googleLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.destructive),
    );
  }

  void _showSuccess(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.success),
    );
  }

  void _submitPrimary(bool loading) {
    if (loading) return;
    switch (_view) {
      case AuthView.login:
        _login();
      case AuthView.register:
        _register();
      case AuthView.forgot:
        if (!_forgotSent) _forgot();
    }
  }

  String _primaryLabel() {
    if (_view == AuthView.forgot) {
      return _forgotSent ? 'Quay lại đăng nhập' : 'Gửi email khôi phục';
    }
    return _view == AuthView.login ? 'Đăng nhập' : 'Đăng ký';
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final loading = auth.isLoading;
    final isForgot = _view == AuthView.forgot;

    return Scaffold(
      extendBodyBehindAppBar: true,
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: AppColors.background.withValues(alpha: 0.85),
        elevation: 0,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(AppAssets.logoIcon, width: 24, height: 24),
            const SizedBox(width: 8),
            Text(isForgot ? 'Quên mật khẩu' : 'Tài khoản'),
          ],
        ),
        leading: isForgot
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() {
                  _view = AuthView.login;
                  _forgotSent = false;
                }),
              )
            : null,
      ),
      body: AuthHeroBackground(
        child: SafeArea(
          bottom: false,
          child: isForgot
              ? _buildForgot(loading)
              : DefaultTabController(
                  length: 2,
                  initialIndex: _view == AuthView.register ? 1 : 0,
                  child: Column(
                    children: [
                      TabBar(
                        onTap: (i) => setState(
                          () => _view =
                              i == 0 ? AuthView.login : AuthView.register,
                        ),
                        indicatorColor: AppColors.primary,
                        indicatorWeight: 3,
                        dividerColor: Colors.transparent,
                        labelColor: AppColors.primary,
                        unselectedLabelColor: AppColors.mutedForeground,
                        labelStyle: const TextStyle(fontWeight: FontWeight.w700),
                        tabs: const [
                          Tab(text: 'Đăng nhập'),
                          Tab(text: 'Đăng ký'),
                        ],
                      ),
                      Expanded(
                        child: TabBarView(
                          physics: const NeverScrollableScrollPhysics(),
                          children: [
                            _buildLogin(loading),
                            _buildRegister(loading),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
        ),
      ),
      bottomNavigationBar: AuthStickyBar(
        child: GradientCtaButton(
          label: _primaryLabel(),
          loading: loading && _view != AuthView.forgot,
          onPressed: loading && _view != AuthView.forgot
              ? null
              : isForgot && _forgotSent
                  ? () => setState(() {
                        _view = AuthView.login;
                        _forgotSent = false;
                      })
                  : () => _submitPrimary(loading),
        ),
      ),
    );
  }

  Widget _buildLogin(bool loading) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.page,
        AppSpacing.md,
        AppSpacing.page,
        AppSpacing.lg,
      ),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      children: [
        PageHeading(
          title: 'Chào mừng trở lại',
          subtitle: 'Đăng nhập để dùng AI, ví xu và thư viện asset.',
        ),
        const SizedBox(height: 16),
        AuthFormCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              GoogleSignInButton(
                onPressed: (loading || _googleLoading) ? null : _google,
                loading: _googleLoading,
              ),
              const SizedBox(height: 16),
              const AuthDivider(),
              const SizedBox(height: 16),
              TextField(
                controller: _loginEmail,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.alternate_email, size: 20),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _loginPassword,
                obscureText: !_showPassword,
                autofillHints: const [AutofillHints.password],
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _login(),
                decoration: InputDecoration(
                  labelText: 'Mật khẩu',
                  prefixIcon: const Icon(Icons.lock_outline, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _showPassword ? Icons.visibility_off : Icons.visibility,
                    ),
                    onPressed: () =>
                        setState(() => _showPassword = !_showPassword),
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Checkbox(
                    value: _rememberMe,
                    onChanged: loading
                        ? null
                        : (v) => setState(() => _rememberMe = v ?? true),
                    fillColor: WidgetStateProperty.resolveWith((states) {
                      if (states.contains(WidgetState.selected)) {
                        return AppColors.primary;
                      }
                      return null;
                    }),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: loading
                          ? null
                          : () => setState(() => _rememberMe = !_rememberMe),
                      behavior: HitTestBehavior.opaque,
                      child: const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Text('Ghi nhớ đăng nhập'),
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: loading
                        ? null
                        : () => setState(() {
                              _view = AuthView.forgot;
                              _forgotEmail.text = _loginEmail.text;
                            }),
                    child: const Text('Quên mật khẩu?'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRegister(bool loading) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.page,
        AppSpacing.md,
        AppSpacing.page,
        AppSpacing.lg,
      ),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      children: [
        PageHeading(
          title: 'Tạo tài khoản',
          subtitle: 'Nhận xu miễn phí để thử AssetBox AI.',
        ),
        const SizedBox(height: 16),
        AuthFormCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              GoogleSignInButton(
                onPressed: (loading || _googleLoading) ? null : _google,
                loading: _googleLoading,
              ),
              const SizedBox(height: 16),
              const AuthDivider(),
              const SizedBox(height: 16),
              TextField(
                controller: _regName,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Họ tên',
                  prefixIcon: Icon(Icons.person_outline, size: 20),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _regEmail,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.alternate_email, size: 20),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _regPassword,
                obscureText: !_showPassword,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _register(),
                decoration: InputDecoration(
                  labelText: 'Mật khẩu (tối thiểu 6 ký tự)',
                  prefixIcon: const Icon(Icons.lock_outline, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _showPassword ? Icons.visibility_off : Icons.visibility,
                    ),
                    onPressed: () =>
                        setState(() => _showPassword = !_showPassword),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildForgot(bool loading) {
    if (_forgotSent) {
      return Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: AuthFormCard(
          child: EmptyState(
            icon: Icons.mark_email_read_outlined,
            title: 'Đã gửi email',
            subtitle:
                'Kiểm tra hộp thư ${_forgotEmail.text.trim()} và làm theo hướng dẫn đặt lại mật khẩu.',
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.page,
        AppSpacing.md,
        AppSpacing.page,
        AppSpacing.lg,
      ),
      children: [
        PageHeading(
          title: 'Khôi phục mật khẩu',
          subtitle:
              'Nhập email đã đăng ký — chúng tôi sẽ gửi link đặt lại mật khẩu.',
        ),
        const SizedBox(height: 16),
        AuthFormCard(
          child: TextField(
            controller: _forgotEmail,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _forgot(),
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.alternate_email, size: 20),
            ),
          ),
        ),
      ],
    );
  }
}

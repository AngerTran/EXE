import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config/app_assets.dart';
import 'config/app_config.dart';
import 'core/router/app_router.dart';
import 'core/router/deep_link_state.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_tokens.dart';
import 'core/theme/app_theme.dart';
import 'providers/service_providers.dart';

class AssetBoxApp extends ConsumerStatefulWidget {
  const AssetBoxApp({super.key});

  @override
  ConsumerState<AssetBoxApp> createState() => _AssetBoxAppState();
}

class _AssetBoxAppState extends ConsumerState<AssetBoxApp> {
  final _appLinks = AppLinks();

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  Future<void> _initDeepLinks() async {
    try {
      final initial = await _appLinks.getInitialLink();
      if (initial != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _handleDeepLink(initial);
        });
      }
      _appLinks.uriLinkStream.listen(_handleDeepLink);
    } catch (_) {}
  }

  void _handleDeepLink(Uri uri) {
    if (!isAppDeepLink(uri)) return;

    final route = deepLinkRouteFor(uri);
    if (route == null) return;

    stashDeepLinkUri(ref, uri);
    ref.read(routerProvider).go(route);
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final router = ref.watch(routerProvider);

    if (auth.isBootstrapping) {
      return MaterialApp(
        title: AppConfig.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark,
        home: Scaffold(
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.background,
                  Color(0xFF0F172A),
                ],
              ),
            ),
            child: Builder(
              builder: (context) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      child: Image.asset(
                        AppAssets.logoIcon,
                        width: 64,
                        height: 64,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      AppConfig.appName,
                      style: Theme.of(context)
                          .primaryTextTheme
                          .headlineSmall
                          ?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                    ),
                    const SizedBox(height: AppSpacing.xxl),
                    const SizedBox(
                      width: 28,
                      height: 28,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      routerConfig: router,
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_assets.dart';
import '../../config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/service_providers.dart';
import '../../widgets/branded_background.dart';
import '../../widgets/common_widgets.dart';

class MainShell extends ConsumerWidget {
  const MainShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final cart = ref.watch(cartProvider);
    final location = GoRouterState.of(context).matchedLocation;
    final tabs = auth.isLoggedIn ? _authTabs : _guestTabs;
    final currentIndex = _indexForLocation(location, auth.isLoggedIn);
    final cartCount = cart.maybeWhen(data: (c) => c.itemCount, orElse: () => 0);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.background.withValues(alpha: 0.94),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                AppAssets.logoIcon,
                width: 28,
                height: 28,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 10),
            Text(AppConfig.appName),
          ],
        ),
        actions: [
          if (auth.isLoggedIn) ...[
            IconButton(
              icon: const Icon(Icons.bookmark_border),
              tooltip: 'Đã lưu',
              onPressed: () => context.push('/bookmarks'),
            ),
            IconButton(
              onPressed: () => context.push('/cart'),
              tooltip: 'Giỏ hàng',
              icon: Badge(
                isLabelVisible: cartCount > 0,
                label: Text('$cartCount'),
                child: const Icon(Icons.shopping_cart_outlined),
              ),
            ),
          ],
          if (auth.isLoggedIn && auth.user != null)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Center(
                child: XuBadge(
                  balance: auth.user!.credits,
                  isUnlimited: auth.user!.isUnlimited,
                  compact: true,
                ),
              ),
            ),
        ],
      ),
      body: SiteBackground(child: child),
      bottomNavigationBar: NavigationBar(
        backgroundColor: AppColors.card.withValues(alpha: 0.96),
        indicatorColor: AppColors.primary.withValues(alpha: 0.18),
        surfaceTintColor: Colors.transparent,
        elevation: 8,
        height: 64,
        selectedIndex: currentIndex.clamp(0, tabs.length - 1),
        onDestinationSelected: (i) {
          final route = tabs[i].route;
          if (!auth.isLoggedIn && route == '/profile') {
            context.push('/auth');
            return;
          }
          context.go(route);
        },
        destinations: tabs
            .map(
              (t) => NavigationDestination(
                icon: Icon(t.icon),
                selectedIcon: Icon(t.selectedIcon, color: AppColors.primary),
                label: t.label,
              ),
            )
            .toList(),
      ),
    );
  }

  int _indexForLocation(String location, bool loggedIn) {
    final tabs = loggedIn ? _authTabs : _guestTabs;
    final idx = tabs.indexWhere((t) => t.route == location);
    return idx >= 0 ? idx : 0;
  }
}

class _TabItem {
  const _TabItem({
    required this.route,
    required this.label,
    required this.icon,
    required this.selectedIcon,
  });

  final String route;
  final String label;
  final IconData icon;
  final IconData selectedIcon;
}

const _authTabs = [
  _TabItem(
    route: '/',
    label: 'Trang chủ',
    icon: Icons.home_outlined,
    selectedIcon: Icons.home_rounded,
  ),
  _TabItem(
    route: '/ai',
    label: 'AI',
    icon: Icons.auto_awesome_outlined,
    selectedIcon: Icons.auto_awesome,
  ),
  _TabItem(
    route: '/marketplace',
    label: 'Chợ',
    icon: Icons.storefront_outlined,
    selectedIcon: Icons.storefront,
  ),
  _TabItem(
    route: '/library',
    label: 'Thư viện',
    icon: Icons.folder_outlined,
    selectedIcon: Icons.folder,
  ),
  _TabItem(
    route: '/profile',
    label: 'Tôi',
    icon: Icons.person_outline,
    selectedIcon: Icons.person,
  ),
];

const _guestTabs = [
  _TabItem(
    route: '/',
    label: 'Trang chủ',
    icon: Icons.home_outlined,
    selectedIcon: Icons.home_rounded,
  ),
  _TabItem(
    route: '/marketplace',
    label: 'Chợ',
    icon: Icons.storefront_outlined,
    selectedIcon: Icons.storefront,
  ),
  _TabItem(
    route: '/pricing',
    label: 'Gói',
    icon: Icons.workspace_premium_outlined,
    selectedIcon: Icons.workspace_premium,
  ),
  _TabItem(
    route: '/ai',
    label: 'AI',
    icon: Icons.auto_awesome_outlined,
    selectedIcon: Icons.auto_awesome,
  ),
  _TabItem(
    route: '/profile',
    label: 'Đăng nhập',
    icon: Icons.login,
    selectedIcon: Icons.login,
  ),
];

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_assets.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../providers/service_providers.dart';
import '../../widgets/branded_background.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/notification_panel.dart';

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
    final activeTab = tabs[currentIndex.clamp(0, tabs.length - 1)];

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.background.withValues(alpha: 0.94),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.sm),
              child: Image.asset(
                AppAssets.logoIcon,
                width: 28,
                height: 28,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activeTab.label,
                  style: Theme.of(context).primaryTextTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.foreground,
                      ),
                ),
                if (activeTab.route == '/')
                  Text(
                    'AssetBox',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                  ),
              ],
            ),
          ],
        ),
        actions: [
          if (auth.isLoggedIn) ...[
            const NotificationBellButton(),
            IconButton(
              icon: const Icon(Icons.bookmark_border_rounded),
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
              padding: const EdgeInsets.only(right: AppSpacing.md),
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
        selectedIndex: currentIndex.clamp(0, tabs.length - 1),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
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
                selectedIcon: Icon(t.selectedIcon),
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
    route: '/marketplace',
    label: 'Chợ',
    icon: Icons.storefront_outlined,
    selectedIcon: Icons.storefront_rounded,
  ),
  _TabItem(
    route: '/ai',
    label: 'AI',
    icon: Icons.auto_awesome_outlined,
    selectedIcon: Icons.auto_awesome,
  ),
  _TabItem(
    route: '/library',
    label: 'Thư viện',
    icon: Icons.folder_outlined,
    selectedIcon: Icons.folder_rounded,
  ),
  _TabItem(
    route: '/profile',
    label: 'Tôi',
    icon: Icons.person_outline_rounded,
    selectedIcon: Icons.person_rounded,
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
    selectedIcon: Icons.storefront_rounded,
  ),
  _TabItem(
    route: '/ai',
    label: 'AI',
    icon: Icons.auto_awesome_outlined,
    selectedIcon: Icons.auto_awesome,
  ),
  _TabItem(
    route: '/pricing',
    label: 'Gói',
    icon: Icons.workspace_premium_outlined,
    selectedIcon: Icons.workspace_premium_rounded,
  ),
  _TabItem(
    route: '/profile',
    label: 'Đăng nhập',
    icon: Icons.login_rounded,
    selectedIcon: Icons.login_rounded,
  ),
];

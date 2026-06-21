import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';



import '../../providers/service_providers.dart';
import 'deep_link_state.dart';

import '../../screens/auth/auth_callback_screen.dart';

import '../../screens/auth/auth_screen.dart';

import '../../screens/auth/reset_password_screen.dart';

import '../../screens/commerce/cart_screen.dart';

import '../../screens/commerce/checkout_screen.dart';
import '../../screens/commerce/checkout_waiting_screen.dart';

import '../../screens/commerce/orders_screen.dart';

import '../../screens/library/user_asset_detail_screen.dart';

import '../../screens/marketplace/asset_detail_screen.dart';

import '../../screens/marketplace/bookmarks_screen.dart';

import '../../screens/shell/main_shell.dart';

import '../../screens/ai/ai_dashboard_screen.dart';

import '../../screens/home/home_screen.dart';

import '../../screens/library/my_assets_screen.dart';

import '../../screens/marketplace/marketplace_screen.dart';

import '../../screens/pricing/pricing_screen.dart';

import '../../screens/profile/edit_profile_screen.dart';

import '../../screens/profile/profile_screen.dart';

import '../../screens/profile/purchase_history_screen.dart';

import '../../screens/static/contact_screen.dart';

import '../../screens/static/privacy_screen.dart';

import '../../screens/static/terms_screen.dart';



final rootNavigatorKey = GlobalKey<NavigatorState>();



final routerProvider = Provider<GoRouter>((ref) {

  final authListenable = _AuthListenable(ref);



  return GoRouter(

    navigatorKey: rootNavigatorKey,

    initialLocation: '/',

    refreshListenable: authListenable,

    routes: [

      ShellRoute(

        builder: (context, state, child) => MainShell(child: child),

        routes: [

          GoRoute(path: '/', builder: (_, _) => const HomeScreen()),

          GoRoute(path: '/ai', builder: (_, _) => const AiDashboardScreen()),

          GoRoute(

            path: '/marketplace',

            builder: (_, _) => const MarketplaceScreen(),

          ),

          GoRoute(

            path: '/library',

            builder: (_, _) => const MyAssetsScreen(),

          ),

          GoRoute(

            path: '/pricing',

            builder: (_, _) => const PricingScreen(),

          ),

          GoRoute(

            path: '/profile',

            builder: (_, _) => const ProfileScreen(),

            routes: [

              GoRoute(

                path: 'edit',

                builder: (_, _) => const EditProfileScreen(),

              ),

              GoRoute(

                path: 'purchases',

                builder: (_, _) => const PurchaseHistoryScreen(),

              ),

            ],

          ),

        ],

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/marketplace/:id',

        builder: (context, state) =>

            AssetDetailScreen(assetId: state.pathParameters['id']!),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/library/:id',

        builder: (context, state) =>

            UserAssetDetailScreen(assetId: state.pathParameters['id']!),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/auth',

        builder: (_, _) => const AuthScreen(),

      ),

      GoRoute(
        parentNavigatorKey: rootNavigatorKey,
        path: '/auth/callback',
        builder: (_, _) => const AuthCallbackScreen(),
      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/auth/reset',

        builder: (context, state) => ResetPasswordScreen(

          initialUri: state.extra as Uri?,

        ),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/cart',

        builder: (_, _) => const CartScreen(),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/orders',

        builder: (_, _) => const OrdersScreen(),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/bookmarks',

        builder: (_, _) => const BookmarksScreen(),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/checkout/subscription/:slug',

        builder: (context, state) => CheckoutScreen.subscription(

          planSlug: state.pathParameters['slug']!,

        ),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/checkout/credits/:packId',

        builder: (context, state) => CheckoutScreen.credits(

          packId: state.pathParameters['packId']!,

        ),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/checkout/assets',

        builder: (_, _) => const CheckoutScreen.assets(),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/checkout/waiting/:orderId',

        builder: (context, state) => CheckoutWaitingScreen(
          orderId: state.pathParameters['orderId']!,
          orderCode: state.uri.queryParameters['orderCode'] ?? '',
          itemLabel: state.uri.queryParameters['label'] ?? 'Đơn hàng',
        ),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/contact',

        builder: (_, _) => const ContactScreen(),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/terms',

        builder: (_, _) => const TermsScreen(),

      ),

      GoRoute(

        parentNavigatorKey: rootNavigatorKey,

        path: '/privacy',

        builder: (_, _) => const PrivacyScreen(),

      ),

    ],

    redirect: (context, state) {
      final uri = state.uri;
      if (uri.scheme == 'vn.assetbox.app') {
        final route = deepLinkRouteFor(uri);
        if (route != null) {
          stashDeepLinkUriFromRef(ref, uri);
          return route;
        }
      }

      final loggedIn = ref.read(authProvider).isLoggedIn;
      final loc = state.matchedLocation;



      if (loc == '/auth' && loggedIn) return '/';



      if (!loggedIn && loc == '/library') return '/profile';



      if (!loggedIn && loc.startsWith('/library/')) return '/auth';



      if (!loggedIn && loc == '/profile/edit') return '/auth';



      if (!loggedIn &&

          (loc.startsWith('/checkout') ||

              loc == '/cart' ||

              loc == '/orders' ||

              loc == '/bookmarks')) {

        return '/auth';

      }



      return null;

    },

  );

});



class _AuthListenable extends ChangeNotifier {

  _AuthListenable(this.ref) {

    ref.listen(authProvider, (_, _) => notifyListeners());

  }



  final Ref ref;

}



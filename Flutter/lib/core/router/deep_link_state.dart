import 'package:flutter_riverpod/flutter_riverpod.dart';

/// URI từ deep link OAuth — dùng khi app cold-start (GoRouter nhận vn.assetbox.app://...).
final deepLinkOAuthUriProvider = StateProvider<Uri?>((ref) => null);

/// URI từ deep link reset password.
final deepLinkResetUriProvider = StateProvider<Uri?>((ref) => null);

bool isAppDeepLink(Uri uri) => uri.scheme == 'vn.assetbox.app' && uri.host == 'auth';

String? deepLinkRouteFor(Uri uri) {
  if (!isAppDeepLink(uri)) return null;
  final path = uri.path;
  if (path == '/callback' || path == '/callback/') return '/auth/callback';
  if (path == '/reset' || path == '/reset/') return '/auth/reset';
  return null;
}

void stashDeepLinkUri(WidgetRef ref, Uri uri) {
  final route = deepLinkRouteFor(uri);
  if (route == '/auth/callback') {
    ref.read(deepLinkOAuthUriProvider.notifier).state = uri;
  } else if (route == '/auth/reset') {
    ref.read(deepLinkResetUriProvider.notifier).state = uri;
  }
}

void stashDeepLinkUriFromRef(Ref ref, Uri uri) {
  final route = deepLinkRouteFor(uri);
  if (route == '/auth/callback') {
    ref.read(deepLinkOAuthUriProvider.notifier).state = uri;
  } else if (route == '/auth/reset') {
    ref.read(deepLinkResetUriProvider.notifier).state = uri;
  }
}

Uri? takeOAuthCallbackUri(WidgetRef ref) {
  final fromProvider = ref.read(deepLinkOAuthUriProvider);
  if (fromProvider != null) {
    ref.read(deepLinkOAuthUriProvider.notifier).state = null;
    return fromProvider;
  }
  return null;
}

/// Chờ URI OAuth (deep link có thể đến sau khi màn callback mount).
Future<Uri?> waitForOAuthCallbackUri(WidgetRef ref) async {
  for (var i = 0; i < 30; i++) {
    final pending = ref.read(deepLinkOAuthUriProvider);
    if (pending != null) {
      ref.read(deepLinkOAuthUriProvider.notifier).state = null;
      return pending;
    }
    await Future<void>.delayed(Duration(milliseconds: 50 + i * 25));
  }
  return null;
}

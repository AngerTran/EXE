/// Map action_url từ BE/Supabase (web paths) sang route Flutter.
String? flutterRouteForNotificationAction(String? actionUrl) {
  if (actionUrl == null || actionUrl.isEmpty) return null;

  var path = actionUrl.trim();
  if (path.contains('://')) {
    final uri = Uri.tryParse(path);
    path = uri?.path ?? path;
  }
  if (!path.startsWith('/')) path = '/$path';

  return switch (path) {
    '/my-assets' => '/library',
    '/my-orders' => '/orders',
    '/dashboard' => '/',
    '/pricing' => '/pricing',
    '/profile' => '/profile',
    '/cart' => '/cart',
    '/bookmarks' => '/bookmarks',
    '/marketplace' => '/marketplace',
    '/ai' => '/ai',
    _ when path.startsWith('/marketplace/') => path,
    _ when path.startsWith('/library/') => path,
    _ when path.startsWith('/checkout/') => path,
    _ => path,
  };
}

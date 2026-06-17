import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'config/auth_deep_links.dart';
import 'core/utils/url_protocol.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await registerAppUrlProtocol(AuthDeepLinks.scheme);
  runApp(const ProviderScope(child: AssetBoxApp()));
}

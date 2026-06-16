import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:assetbox_mobile/app.dart';

void main() {
  testWidgets('AssetBox app smoke test', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: AssetBoxApp()));
    await tester.pump();
    expect(find.text('AssetBox'), findsOneWidget);
  });
}

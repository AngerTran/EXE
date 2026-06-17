import 'dart:io';

/// Đăng ký custom URL scheme trên Windows để trình duyệt mở lại app sau OAuth.
Future<void> registerAppUrlProtocol(String scheme) async {
  if (!Platform.isWindows) return;

  final exe = Platform.resolvedExecutable.replaceAll('/', r'\');
  final schemeKey = 'HKCU\\Software\\Classes\\$scheme';
  final title = 'URL:${scheme[0].toUpperCase()}${scheme.substring(1)}';

  await Process.run('reg', ['add', schemeKey, '/ve', '/d', title, '/f']);
  await Process.run('reg', ['add', '$schemeKey\\URL Protocol', '/ve', '/d', '', '/f']);
  await Process.run('reg', [
    'add',
    '$schemeKey\\shell\\open\\command',
    '/ve',
    '/d',
    '"$exe" "%1"',
    '/f',
  ]);
}

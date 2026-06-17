import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/error_messages.dart';
import '../../models/ai_models.dart';
import '../../providers/service_providers.dart';
import '../../widgets/asset_card.dart';
import '../../widgets/common_widgets.dart';

class AiDashboardScreen extends ConsumerStatefulWidget {
  const AiDashboardScreen({super.key});

  @override
  ConsumerState<AiDashboardScreen> createState() => _AiDashboardScreenState();
}

class _AiDashboardScreenState extends ConsumerState<AiDashboardScreen> {
  AiSessionDetail? _session;
  List<AiSessionListItem> _sessions = [];
  bool _loading = false;
  bool _sending = false;
  bool _outlineLoading = false;
  bool _exportLoading = false;
  String? _outline;
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _initSession();
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _showSnack(String msg, {bool error = true}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: error ? AppColors.destructive : AppColors.success,
      ),
    );
  }

  Future<void> _initSession() async {
    final auth = ref.read(authProvider);
    if (!auth.isLoggedIn) return;

    setState(() => _loading = true);
    try {
      final ai = await ref.read(aiServiceProvider.future);
      var sessions = await ai.fetchSessions();

      final active = sessions.where((s) => s.messageCount > 0).toList();
      final empty = sessions.where((s) => s.messageCount == 0).toList();

      String targetId;
      if (active.isNotEmpty) {
        targetId = active.first.id;
        await ai.cleanupEmptySessions(keepId: targetId);
      } else if (empty.isNotEmpty) {
        targetId = empty.first.id;
        await ai.cleanupEmptySessions(keepId: targetId);
      } else {
        final created = await ai.createSession(title: 'AssetBox AI Chat');
        targetId = created.id;
      }

      sessions = await ai.fetchSessions();
      final detail = await ai.fetchSession(targetId);
      setState(() {
        _sessions = sessions;
        _session = detail;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      _showSnack(friendlyErrorMessage(e));
    }
  }

  Future<void> _send() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty || _session == null || _sending) return;

    setState(() => _sending = true);
    _inputCtrl.clear();

    try {
      final ai = await ref.read(aiServiceProvider.future);
      final result = await ai.sendMessage(_session!.id, text);
      setState(() {
        _session = AiSessionDetail(
          id: _session!.id,
          title: _session!.title,
          isArchived: _session!.isArchived,
          messages: [
            ..._session!.messages,
            result.userMessage,
            result.assistantMessage,
          ],
        );
        _sending = false;
      });
      ref.read(authProvider.notifier).refreshUser();

      await Future<void>.delayed(const Duration(milliseconds: 100));
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    } catch (e) {
      setState(() => _sending = false);
      _showSnack(friendlyErrorMessage(e));
    }
  }

  Future<void> _switchSession(String id) async {
    setState(() => _loading = true);
    try {
      final ai = await ref.read(aiServiceProvider.future);
      final detail = await ai.fetchSession(id);
      setState(() {
        _session = detail;
        _outline = null;
        _loading = false;
      });
      _scaffoldKey.currentState?.closeDrawer();
    } catch (e) {
      setState(() => _loading = false);
      _showSnack(friendlyErrorMessage(e));
    }
  }

  Future<void> _newSession() async {
    try {
      final ai = await ref.read(aiServiceProvider.future);
      if (_session != null) {
        await ai.cleanupEmptySessions(keepId: _session!.id);
      }
      final created = await ai.createSession(title: 'Phiên mới');
      final sessions = await ai.fetchSessions();
      final detail = await ai.fetchSession(created.id);
      setState(() {
        _sessions = sessions;
        _session = detail;
        _outline = null;
      });
      _scaffoldKey.currentState?.closeDrawer();
    } catch (e) {
      _showSnack(friendlyErrorMessage(e));
    }
  }

  Future<void> _deleteSession(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xóa phiên chat?'),
        content: const Text('Hành động này không thể hoàn tác.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Xóa',
              style: TextStyle(color: AppColors.destructive),
            ),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    try {
      final ai = await ref.read(aiServiceProvider.future);
      await ai.deleteSession(id);
      await _initSession();
    } catch (e) {
      _showSnack(friendlyErrorMessage(e));
    }
  }

  Future<void> _generateOutline() async {
    if (_session == null) return;
    if (_session!.messages.where((m) => m.isUser).isEmpty) {
      _showSnack('Hãy chat ít nhất một tin nhắn trước khi tạo game outline.');
      return;
    }
    setState(() => _outlineLoading = true);
    try {
      final ai = await ref.read(aiServiceProvider.future);
      final result = await ai.generateOutline(_session!.id);
      setState(() => _outline = result.content);
      ref.read(authProvider.notifier).refreshUser();
      if (mounted) _showOutlineSheet();
    } catch (e) {
      _showSnack(friendlyErrorMessage(e));
    } finally {
      if (mounted) setState(() => _outlineLoading = false);
    }
  }

  Future<void> _shareMarkdown(String content, String filename) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$filename');
    await file.writeAsString(content);
    await Share.shareXFiles(
      [XFile(file.path)],
      subject: 'AssetBox Game Outline',
      text: 'Game outline từ AssetBox AI',
    );
  }

  Future<void> _exportOutline() async {
    if (_session == null) return;
    if (_session!.messages.isEmpty) {
      _showSnack('Chưa có nội dung chat để xuất file.');
      return;
    }

    setState(() => _exportLoading = true);
    try {
      String content;
      if (_outline != null && _outline!.trim().isNotEmpty) {
        content = _outline!;
      } else {
        final ai = await ref.read(aiServiceProvider.future);
        final data = await ai.exportSession(_session!.id);
        content = data['content'] ?? '';
        if (content.isEmpty) {
          throw Exception('Không có nội dung để xuất.');
        }
        setState(() => _outline = content);
      }

      await _shareMarkdown(
        content,
        'assetbox-outline-${_session!.id.substring(0, 8)}.md',
      );
    } catch (e) {
      _showSnack(friendlyErrorMessage(e));
    } finally {
      if (mounted) setState(() => _exportLoading = false);
    }
  }

  void _showOutlineSheet() {
    if (_outline == null) return;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.65,
        maxChildSize: 0.92,
        builder: (_, scroll) => Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.page,
            AppSpacing.md,
            AppSpacing.page,
            AppSpacing.page,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Game Outline',
                      style: Theme.of(ctx).primaryTextTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                  TextButton.icon(
                    onPressed: _exportLoading
                        ? null
                        : () async {
                            Navigator.pop(ctx);
                            await _exportOutline();
                          },
                    icon: _exportLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.share_outlined, size: 18),
                    label: const Text('Chia sẻ file'),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Expanded(
                child: SingleChildScrollView(
                  controller: scroll,
                  child: Text(
                    _outline!,
                    style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(
                          height: 1.55,
                          color: AppColors.foreground,
                        ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    if (!auth.isLoggedIn) {
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxl),
          child: AppCard(
            child: EmptyState(
              icon: Icons.auto_awesome_outlined,
              title: 'AssetBox AI',
              subtitle:
                  'Đăng nhập để phân tích ý tưởng game và nhận gợi ý asset phù hợp.',
              action: GradientCtaButton(
                label: 'Đăng nhập',
                icon: Icons.login_rounded,
                expand: false,
                onPressed: () => context.push('/auth'),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.transparent,
      drawer: Drawer(
        backgroundColor: AppColors.background,
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.all(AppSpacing.page),
                child: Text(
                  'Phiên chat',
                  style: Theme.of(context).primaryTextTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.page),
                child: GradientCtaButton(
                  label: 'Phiên mới',
                  icon: Icons.add_rounded,
                  expand: true,
                  onPressed: _newSession,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              const Divider(height: 1, color: AppColors.border),
              Expanded(
                child: _sessions.isEmpty
                    ? const Center(
                        child: Text(
                          'Chưa có phiên nào',
                          style: TextStyle(color: AppColors.mutedForeground),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: AppSpacing.sm,
                        ),
                        itemCount: _sessions.length,
                        itemBuilder: (context, i) {
                          final s = _sessions[i];
                          final selected = s.id == _session?.id;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () => _switchSession(s.id),
                                borderRadius:
                                    BorderRadius.circular(AppRadius.md),
                                child: Ink(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: AppSpacing.md,
                                    vertical: AppSpacing.md,
                                  ),
                                  decoration: BoxDecoration(
                                    color: selected
                                        ? AppColors.primary
                                            .withValues(alpha: 0.12)
                                        : AppColors.card
                                            .withValues(alpha: 0.6),
                                    borderRadius:
                                        BorderRadius.circular(AppRadius.md),
                                    border: Border.all(
                                      color: selected
                                          ? AppColors.primary
                                              .withValues(alpha: 0.4)
                                          : AppColors.border,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.chat_bubble_outline_rounded,
                                        size: 18,
                                        color: selected
                                            ? AppColors.primary
                                            : AppColors.mutedForeground,
                                      ),
                                      const SizedBox(width: AppSpacing.md),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              s.title,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleSmall
                                                  ?.copyWith(
                                                    fontWeight: FontWeight.w600,
                                                    color: AppColors.foreground,
                                                  ),
                                            ),
                                            Text(
                                              '${s.messageCount} tin nhắn',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .labelSmall
                                                  ?.copyWith(
                                                    color: AppColors
                                                        .mutedForeground,
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(
                                          Icons.delete_outline_rounded,
                                          size: 18,
                                          color: AppColors.mutedForeground,
                                        ),
                                        onPressed: () => _deleteSession(s.id),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.sm,
              AppSpacing.sm,
              AppSpacing.page,
              AppSpacing.sm,
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.menu_rounded),
                  tooltip: 'Phiên chat',
                  onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                ),
                Expanded(
                  child: Text(
                    _session?.title ?? 'Đang tải...',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.foreground,
                        ),
                  ),
                ),
                if (_outlineLoading)
                  const Padding(
                    padding: EdgeInsets.only(right: 4),
                    child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                IconButton(
                  tooltip: 'Tạo game outline',
                  onPressed: _session == null || _outlineLoading
                      ? null
                      : _generateOutline,
                  icon: const Icon(Icons.article_outlined),
                ),
                IconButton(
                  tooltip: 'Xuất / chia sẻ outline',
                  onPressed: _session == null || _exportLoading
                      ? null
                      : () {
                          if (_outline != null) {
                            _showOutlineSheet();
                          } else {
                            _exportOutline();
                          }
                        },
                  icon: _exportLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.ios_share_rounded),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView(message: 'Đang tải phiên chat...')
                : (_session?.messages.isEmpty ?? true)
                    ? EmptyState(
                        icon: Icons.auto_awesome,
                        title: 'Bắt đầu trò chuyện',
                        subtitle:
                            'Mô tả ý tưởng game — AI sẽ phân tích và gợi ý asset.',
                      )
                    : ListView.builder(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.page,
                          vertical: AppSpacing.sm,
                        ),
                        itemCount: (_session?.messages.length ?? 0) +
                            (_sending ? 1 : 0),
                        itemBuilder: (context, i) {
                          if (_sending &&
                              i == (_session?.messages.length ?? 0)) {
                            return const Padding(
                              padding: EdgeInsets.all(AppSpacing.lg),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  SizedBox(width: AppSpacing.md),
                                  Text('AI đang trả lời...'),
                                ],
                              ),
                            );
                          }
                          final msg = _session!.messages[i];
                          final suggestions = msg.suggestedAssets
                              ?.map(
                                (a) => (
                                  id: a.assetId,
                                  title: a.title,
                                  thumb: a.thumbnailUrl,
                                ),
                              )
                              .toList();
                          return Padding(
                            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                            child: Align(
                              alignment: msg.isUser
                                  ? Alignment.centerRight
                                  : Alignment.centerLeft,
                              child: ChatBubble(
                                content: msg.content,
                                isUser: msg.isUser,
                                suggestedAssets: suggestions,
                                onAssetTap: (id) =>
                                    context.push('/marketplace/$id'),
                              ),
                            ),
                          );
                        },
                      ),
          ),
          Container(
            padding: EdgeInsets.fromLTRB(
              AppSpacing.md,
              AppSpacing.sm,
              AppSpacing.md,
              AppSpacing.sm + MediaQuery.paddingOf(context).bottom,
            ),
            decoration: BoxDecoration(
              color: AppColors.background.withValues(alpha: 0.96),
              border: const Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputCtrl,
                    minLines: 1,
                    maxLines: 4,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _send(),
                    decoration: InputDecoration(
                      hintText: 'Mô tả ý tưởng game của bạn...',
                      filled: true,
                      fillColor: AppColors.card,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg,
                        vertical: AppSpacing.md,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                IconButton.filled(
                  onPressed: _sending ? null : _send,
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.primaryForeground,
                    minimumSize: const Size(48, 48),
                  ),
                  icon: const Icon(Icons.send_rounded),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

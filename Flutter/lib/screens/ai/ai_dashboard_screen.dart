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
import '../../services/ai_service.dart';
import '../../widgets/ai_chat_widgets.dart';
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
      final targetId = await _ensureEmptyChatSession(ai);
      final sessions = await ai.fetchSessions();
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

  /// ChatGPT-style: open a blank chat on tab entry — reuse the latest empty
  /// session or create one; never resume a session that already has messages.
  Future<String> _ensureEmptyChatSession(AiService ai) async {
    final sessions = await ai.fetchSessions();
    final empty = sessions.where((s) => s.messageCount == 0).toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

    final targetId = empty.isNotEmpty
        ? empty.first.id
        : (await ai.createSession(title: 'Phiên mới')).id;

    await ai.cleanupEmptySessions(keepId: targetId);
    return targetId;
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
      await ai.cleanupEmptySessions();
      final created = await ai.createSession(title: 'Phiên mới');
      await ai.cleanupEmptySessions(keepId: created.id);
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
        initialChildSize: 0.72,
        minChildSize: 0.45,
        maxChildSize: 0.92,
        builder: (_, scroll) {
          final bottomInset = MediaQuery.paddingOf(ctx).bottom + 72;
          return Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.page,
              AppSpacing.md,
              AppSpacing.page,
              0,
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
                if (_outline!.length > 800)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: Text(
                      'Vuốt lên để xem toàn bộ outline',
                      style: Theme.of(ctx).textTheme.labelSmall?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                  ),
                Expanded(
                  child: SingleChildScrollView(
                    controller: scroll,
                    padding: EdgeInsets.only(bottom: bottomInset),
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
          );
        },
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
          AiSessionToolbar(
            title: _session?.title ?? 'Đang tải...',
            outlineLoading: _outlineLoading,
            exportLoading: _exportLoading,
            onMenu: () => _scaffoldKey.currentState?.openDrawer(),
            onGenerateOutline:
                _session == null || _outlineLoading ? null : _generateOutline,
            onExport: _session == null || _exportLoading
                ? null
                : () {
                    if (_outline != null) {
                      _showOutlineSheet();
                    } else {
                      _exportOutline();
                    }
                  },
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : (_session?.messages.isEmpty ?? true)
                    ? AiEmptyState(
                        onPromptTap: (prompt) {
                          _inputCtrl.text = prompt;
                          _inputCtrl.selection = TextSelection.collapsed(
                            offset: prompt.length,
                          );
                        },
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
                            return const AiTypingIndicator();
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
          AiChatInputBar(
            controller: _inputCtrl,
            sending: _sending,
            onSend: _send,
          ),
        ],
      ),
    );
  }
}

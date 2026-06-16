import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
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

  Future<void> _initSession() async {
    final auth = ref.read(authProvider);
    if (!auth.isLoggedIn) return;

    setState(() => _loading = true);
    try {
      final ai = await ref.read(aiServiceProvider.future);
      final sessions = await ai.fetchSessions();
      _sessions = sessions;
      if (sessions.isNotEmpty) {
        final detail = await ai.fetchSession(sessions.first.id);
        setState(() {
          _session = detail;
          _loading = false;
        });
      } else {
        final created = await ai.createSession(title: 'Phiên mới');
        setState(() {
          _session = created;
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
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
    }
  }

  Future<void> _newSession() async {
    try {
      final ai = await ref.read(aiServiceProvider.future);
      final created = await ai.createSession(title: 'Phiên mới');
      await _initSession();
      setState(() => _session = created);
      _scaffoldKey.currentState?.closeDrawer();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  Future<void> _deleteSession(String id) async {
    try {
      final ai = await ref.read(aiServiceProvider.future);
      await ai.deleteSession(id);
      await _initSession();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  Future<void> _generateOutline() async {
    if (_session == null) return;
    try {
      final ai = await ref.read(aiServiceProvider.future);
      final result = await ai.generateOutline(_session!.id);
      setState(() => _outline = result.content);
      ref.read(authProvider.notifier).refreshUser();
      if (mounted) _showOutlineSheet();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  Future<void> _exportOutline() async {
    if (_session == null) return;
    try {
      final ai = await ref.read(aiServiceProvider.future);
      final data = await ai.exportSession(_session!.id);
      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Export outline'),
          content: SingleChildScrollView(child: Text(data['content'] ?? '')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Đóng'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  void _showOutlineSheet() {
    if (_outline == null) return;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        builder: (_, scroll) => Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text('Game Outline',
                        style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                  TextButton(
                    onPressed: _exportOutline,
                    child: const Text('Export'),
                  ),
                ],
              ),
              Expanded(
                child: SingleChildScrollView(
                  controller: scroll,
                  child: Text(_outline!),
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
        child: EmptyState(
          icon: Icons.lock_outline,
          title: 'Đăng nhập để dùng AssetBox AI',
          subtitle: 'Phân tích ý tưởng game và nhận gợi ý asset phù hợp.',
          action: GradientCtaButton(
            label: 'Đăng nhập',
            icon: Icons.login,
            expand: false,
            onPressed: () => context.push('/auth'),
          ),
        ),
      );
    }

    return Scaffold(
      key: _scaffoldKey,
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('Phiên chat',
                    style:
                        TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
              ),
              ListTile(
                leading: const Icon(Icons.add),
                title: const Text('Phiên mới'),
                onTap: _newSession,
              ),
              const Divider(),
              Expanded(
                child: ListView(
                  children: _sessions
                      .map(
                        (s) => ListTile(
                          selected: s.id == _session?.id,
                          title: Text(s.title, maxLines: 1),
                          subtitle: Text('${s.messageCount} tin nhắn'),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline, size: 18),
                            onPressed: () => _deleteSession(s.id),
                          ),
                          onTap: () => _switchSession(s.id),
                        ),
                      )
                      .toList(),
                ),
              ),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.menu),
                  onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AssetBox AI',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      Text(
                        _session?.title ?? 'Đang tải...',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.mutedForeground,
                            ),
                      ),
                    ],
                  ),
                ),
                if (auth.user != null)
                  XuBadge(
                    balance: auth.user!.credits,
                    isUnlimited: auth.user!.isUnlimited,
                    compact: true,
                  ),
                IconButton(
                  tooltip: 'Tạo outline',
                  onPressed: _generateOutline,
                  icon: const Icon(Icons.article_outlined),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    itemCount: (_session?.messages.length ?? 0) +
                        (_sending ? 1 : 0),
                    itemBuilder: (context, i) {
                      if (_sending && i == (_session?.messages.length ?? 0)) {
                        return const Padding(
                          padding: EdgeInsets.all(16),
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
                              SizedBox(width: 10),
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
                      return Align(
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
                      );
                    },
                  ),
          ),
          Container(
            padding: EdgeInsets.fromLTRB(
              12,
              8,
              12,
              8 + MediaQuery.paddingOf(context).bottom,
            ),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: AppColors.border)),
              color: AppColors.background,
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputCtrl,
                    minLines: 1,
                    maxLines: 4,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _send(),
                    decoration: const InputDecoration(
                      hintText: 'Mô tả ý tưởng game của bạn...',
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _sending ? null : _send,
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.primaryForeground,
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

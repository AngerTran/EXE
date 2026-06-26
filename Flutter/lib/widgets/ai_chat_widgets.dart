import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_tokens.dart';

const _promptSuggestions = [
  'Platformer 2D pixel art retro, nhân vật nhảy đôi',
  'RPG fantasy turn-based, chiến đấu theo lượt',
  'Puzzle casual mobile, giao diện tối giản',
  'Horror survival, không gian tối hẹp',
];

class AiEmptyState extends StatefulWidget {
  const AiEmptyState({super.key, this.onPromptTap});

  final ValueChanged<String>? onPromptTap;

  @override
  State<AiEmptyState> createState() => _AiEmptyStateState();
}

class _AiEmptyStateState extends State<AiEmptyState>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final body = Theme.of(context).textTheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.page,
        vertical: AppSpacing.xl,
      ),
      child: Column(
        children: [
          AnimatedBuilder(
            animation: _ctrl,
            builder: (context, child) {
              final pulse = (math.sin(_ctrl.value * math.pi * 2) + 1) / 2;
              return SizedBox(
                width: 120,
                height: 120,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 110 + pulse * 14,
                      height: 110 + pulse * 14,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary
                                .withValues(alpha: 0.18 + pulse * 0.12),
                            blurRadius: 28 + pulse * 12,
                            spreadRadius: 2,
                          ),
                          BoxShadow(
                            color: AppColors.secondary
                                .withValues(alpha: 0.1 + pulse * 0.08),
                            blurRadius: 36,
                          ),
                        ],
                      ),
                    ),
                    Transform.rotate(
                      angle: _ctrl.value * math.pi * 2,
                      child: Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: SweepGradient(
                            colors: [
                              AppColors.primary.withValues(alpha: 0.7),
                              AppColors.secondary.withValues(alpha: 0.5),
                              Colors.transparent,
                              AppColors.primary.withValues(alpha: 0.7),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Container(
                      width: 84,
                      height: 84,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.card.withValues(alpha: 0.95),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.35),
                        ),
                      ),
                      child: Icon(
                        Icons.auto_awesome_rounded,
                        size: 36,
                        color: Color.lerp(
                          AppColors.primary,
                          AppColors.secondary,
                          pulse,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: AppSpacing.xl),
          ShaderMask(
            blendMode: BlendMode.srcIn,
            shaderCallback: (bounds) => const LinearGradient(
              colors: [AppColors.primary, AppColors.secondary],
            ).createShader(bounds),
            child: Text(
              'Bắt đầu trò chuyện',
              style: body.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Mô tả ý tưởng game — AI phân tích gameplay, art style và gợi ý asset phù hợp.',
            textAlign: TextAlign.center,
            style: body.bodyMedium?.copyWith(
              color: AppColors.mutedForeground,
              height: 1.5,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            alignment: WrapAlignment.center,
            children: _promptSuggestions.map((prompt) {
              return _PromptChip(
                label: prompt,
                onTap: widget.onPromptTap == null
                    ? null
                    : () => widget.onPromptTap!(prompt),
              );
            }).toList(),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _MiniFeature(
                icon: Icons.psychology_outlined,
                label: 'Phân tích',
              ),
              _dot(),
              _MiniFeature(
                icon: Icons.palette_outlined,
                label: 'Art style',
              ),
              _dot(),
              _MiniFeature(
                icon: Icons.inventory_2_outlined,
                label: 'Gợi ý asset',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _dot() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6),
        child: Container(
          width: 4,
          height: 4,
          decoration: const BoxDecoration(
            color: AppColors.muted,
            shape: BoxShape.circle,
          ),
        ),
      );
}

class _PromptChip extends StatelessWidget {
  const _PromptChip({required this.label, this.onTap});

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.28),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.north_west_rounded,
                size: 12,
                color: AppColors.primary.withValues(alpha: 0.85),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.foreground,
                        height: 1.3,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MiniFeature extends StatelessWidget {
  const _MiniFeature({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.primary),
        const SizedBox(width: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppColors.mutedForeground,
              ),
        ),
      ],
    );
  }
}

class AiTypingIndicator extends StatefulWidget {
  const AiTypingIndicator({super.key});

  @override
  State<AiTypingIndicator> createState() => _AiTypingIndicatorState();
}

class _AiTypingIndicatorState extends State<AiTypingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        decoration: BoxDecoration(
          color: AppColors.card.withValues(alpha: 0.88),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
            bottomLeft: Radius.circular(4),
            bottomRight: Radius.circular(16),
          ),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.auto_awesome_rounded,
              size: 16,
              color: AppColors.secondary,
            ),
            const SizedBox(width: AppSpacing.sm),
            Text(
              'AI đang trả lời',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: AppColors.mutedForeground,
                  ),
            ),
            const SizedBox(width: AppSpacing.sm),
            AnimatedBuilder(
              animation: _ctrl,
              builder: (context, _) {
                return Row(
                  children: List.generate(3, (i) {
                    final t = (_ctrl.value + i * 0.2) % 1.0;
                    final y = math.sin(t * math.pi * 2) * 3;
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: Transform.translate(
                        offset: Offset(0, y),
                        child: Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: Color.lerp(
                              AppColors.primary,
                              AppColors.secondary,
                              t,
                            ),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    );
                  }),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class AiChatInputBar extends StatefulWidget {
  const AiChatInputBar({
    super.key,
    required this.controller,
    required this.onSend,
    this.sending = false,
  });

  final TextEditingController controller;
  final VoidCallback onSend;
  final bool sending;

  @override
  State<AiChatInputBar> createState() => _AiChatInputBarState();
}

class _AiChatInputBarState extends State<AiChatInputBar> {
  final _focus = FocusNode();
  var _focused = false;

  @override
  void initState() {
    super.initState();
    _focus.addListener(() {
      setState(() => _focused = _focus.hasFocus);
    });
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
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
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.lg + 2),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.lg + 2),
              gradient: _focused
                  ? LinearGradient(
                      colors: [
                        AppColors.primary.withValues(alpha: 0.55),
                        AppColors.secondary.withValues(alpha: 0.45),
                      ],
                    )
                  : null,
              border: _focused
                  ? null
                  : Border.all(color: AppColors.border.withValues(alpha: 0.6)),
            ),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.card.withValues(alpha: 0.96),
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: TextField(
                      controller: widget.controller,
                      focusNode: _focus,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) {
                        if (!widget.sending) widget.onSend();
                      },
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.foreground,
                          ),
                      decoration: InputDecoration(
                        hintText: 'Mô tả ý tưởng game của bạn...',
                        hintStyle: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: AppColors.muted),
                        filled: false,
                        isDense: true,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.lg,
                          vertical: AppSpacing.md,
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(right: AppSpacing.sm),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: widget.sending ? null : widget.onSend,
                        borderRadius: BorderRadius.circular(14),
                        child: Ink(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            gradient: widget.sending
                                ? null
                                : const LinearGradient(
                                    colors: [
                                      AppColors.primary,
                                      AppColors.secondary,
                                    ],
                                  ),
                            color: widget.sending
                                ? AppColors.muted.withValues(alpha: 0.4)
                                : null,
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: widget.sending
                                ? null
                                : [
                                    BoxShadow(
                                      color: AppColors.primary
                                          .withValues(alpha: 0.35),
                                      blurRadius: 12,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                          ),
                          child: widget.sending
                              ? const Center(
                                  child: SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: AppColors.foreground,
                                    ),
                                  ),
                                )
                              : const Center(
                                  child: Icon(
                                    Icons.send_rounded,
                                    color: AppColors.primaryForeground,
                                    size: 20,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class AiSessionToolbar extends StatelessWidget {
  const AiSessionToolbar({
    super.key,
    required this.title,
    required this.onMenu,
    this.outlineLoading = false,
    this.exportLoading = false,
    this.onGenerateOutline,
    this.onExport,
  });

  final String title;
  final VoidCallback onMenu;
  final bool outlineLoading;
  final bool exportLoading;
  final VoidCallback? onGenerateOutline;
  final VoidCallback? onExport;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.sm,
        AppSpacing.sm,
        AppSpacing.page,
        AppSpacing.sm,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              color: AppColors.card.withValues(alpha: 0.72),
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.18),
              ),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.menu_rounded),
                  tooltip: 'Phiên chat',
                  onPressed: onMenu,
                ),
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.foreground,
                        ),
                  ),
                ),
                if (outlineLoading)
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
                  onPressed: onGenerateOutline,
                  icon: const Icon(Icons.article_outlined),
                ),
                IconButton(
                  tooltip: 'Xuất / chia sẻ outline',
                  onPressed: onExport,
                  icon: exportLoading
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
        ),
      ),
    );
  }
}

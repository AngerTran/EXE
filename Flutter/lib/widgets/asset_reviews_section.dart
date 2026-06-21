import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_tokens.dart';
import '../core/utils/error_messages.dart';
import '../models/commerce_models.dart';
import '../providers/service_providers.dart';
import 'common_widgets.dart';

final assetReviewsProvider =
    FutureProvider.family<List<ReviewItem>, String>((ref, assetId) async {
  final svc = await ref.watch(reviewsServiceProvider.future);
  return svc.fetchAssetReviews(assetId);
});

/// Danh sách + form đánh giá asset (marketplace & thư viện).
class AssetReviewsSection extends ConsumerStatefulWidget {
  const AssetReviewsSection({super.key, required this.assetId});

  final String assetId;

  @override
  ConsumerState<AssetReviewsSection> createState() =>
      _AssetReviewsSectionState();
}

class _AssetReviewsSectionState extends ConsumerState<AssetReviewsSection> {
  final _comment = TextEditingController();
  final _editComment = TextEditingController();
  int _rating = 5;
  int _editRating = 5;
  String? _editingId;
  bool _submitting = false;

  @override
  void dispose() {
    _comment.dispose();
    _editComment.dispose();
    super.dispose();
  }

  void _refreshReviews() {
    ref.invalidate(assetReviewsProvider(widget.assetId));
  }

  Future<void> _submit() async {
    if (!ref.read(authProvider).isLoggedIn) {
      context.push('/auth');
      return;
    }
    setState(() => _submitting = true);
    try {
      final svc = await ref.read(reviewsServiceProvider.future);
      await svc.createReview(
        widget.assetId,
        _rating,
        comment: _comment.text,
      );
      _comment.clear();
      setState(() => _rating = 5);
      _refreshReviews();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã gửi đánh giá')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(friendlyErrorMessage(e)),
            backgroundColor: AppColors.destructive,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _startEdit(ReviewItem review) {
    setState(() {
      _editingId = review.id;
      _editRating = review.rating;
      _editComment.text = review.comment ?? '';
    });
  }

  void _cancelEdit() {
    setState(() => _editingId = null);
  }

  Future<void> _saveEdit() async {
    final id = _editingId;
    if (id == null) return;
    setState(() => _submitting = true);
    try {
      final svc = await ref.read(reviewsServiceProvider.future);
      await svc.updateReview(
        id,
        rating: _editRating,
        comment: _editComment.text.trim().isEmpty ? null : _editComment.text.trim(),
      );
      setState(() => _editingId = null);
      _refreshReviews();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã cập nhật đánh giá')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(friendlyErrorMessage(e)),
            backgroundColor: AppColors.destructive,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _confirmDelete(ReviewItem review) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xóa đánh giá?'),
        content: const Text('Đánh giá của bạn sẽ bị gỡ khỏi asset này.'),
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
    if (ok != true) return;

    setState(() => _submitting = true);
    try {
      final svc = await ref.read(reviewsServiceProvider.future);
      await svc.deleteReview(review.id);
      if (_editingId == review.id) _editingId = null;
      _refreshReviews();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã xóa đánh giá')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(friendlyErrorMessage(e)),
            backgroundColor: AppColors.destructive,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _formatDate(String iso) {
    try {
      return DateFormat('dd/MM/yyyy').format(DateTime.parse(iso));
    } catch (_) {
      return iso;
    }
  }

  Widget _starPicker({
    required int value,
    required ValueChanged<int> onChanged,
    double size = 28,
  }) {
    return Row(
      children: List.generate(
        5,
        (i) => IconButton(
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
          icon: Icon(
            i < value ? Icons.star_rounded : Icons.star_border_rounded,
            color: AppColors.warning,
            size: size,
          ),
          onPressed: () => onChanged(i + 1),
        ),
      ),
    );
  }

  Widget _reviewCard(ReviewItem r) {
    if (_editingId == r.id) {
      return AppCard(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _starPicker(value: _editRating, onChanged: (v) => setState(() => _editRating = v)),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _editComment,
              minLines: 3,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: 'Nhận xét của bạn...',
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.md,
                ),
                filled: true,
                fillColor: AppColors.background.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            const Divider(height: 1, color: AppColors.border),
            const SizedBox(height: AppSpacing.md),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(onPressed: _submitting ? null : _cancelEdit, child: const Text('Hủy')),
                const SizedBox(width: AppSpacing.sm),
                GradientCtaButton(
                  label: 'Lưu',
                  expand: false,
                  loading: _submitting,
                  onPressed: _submitting ? null : _saveEdit,
                ),
              ],
            ),
          ],
        ),
      );
    }

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: AppColors.primary.withValues(alpha: 0.15),
            child: Text(
              r.userName.isNotEmpty ? r.userName[0].toUpperCase() : '?',
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            r.userName,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          if (r.isOwn) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(
                                  color: AppColors.primary.withValues(alpha: 0.35),
                                ),
                              ),
                              child: Text(
                                'Của bạn',
                                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 10,
                                    ),
                              ),
                            ),
                          ],
                          Text(
                            _formatDate(r.createdAt),
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: AppColors.mutedForeground,
                                ),
                          ),
                        ],
                      ),
                    ),
                    ...List.generate(
                      5,
                      (i) => Icon(
                        i < r.rating ? Icons.star_rounded : Icons.star_border_rounded,
                        size: 14,
                        color: AppColors.warning,
                      ),
                    ),
                    if (r.isOwn) ...[
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                        icon: const Icon(Icons.edit_outlined, size: 18),
                        color: AppColors.mutedForeground,
                        tooltip: 'Sửa đánh giá',
                        onPressed: _submitting ? null : () => _startEdit(r),
                      ),
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                        icon: const Icon(Icons.delete_outline_rounded, size: 18),
                        color: AppColors.mutedForeground,
                        tooltip: 'Xóa đánh giá',
                        onPressed: _submitting ? null : () => _confirmDelete(r),
                      ),
                    ],
                  ],
                ),
                if (r.comment != null && r.comment!.trim().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    r.comment!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.mutedForeground,
                          height: 1.4,
                        ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _composeForm() {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Viết đánh giá của bạn',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: AppSpacing.md),
          _starPicker(value: _rating, onChanged: (v) => setState(() => _rating = v)),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Nhận xét (tuỳ chọn)',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.mutedForeground,
                  fontWeight: FontWeight.w500,
                ),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _comment,
            minLines: 3,
            maxLines: 5,
            decoration: InputDecoration(
              hintText: 'Chia sẻ trải nghiệm với asset này...',
              contentPadding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.md,
              ),
              filled: true,
              fillColor: AppColors.background.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: AppSpacing.lg),
          Align(
            alignment: Alignment.centerRight,
            child: GradientCtaButton(
              label: 'Gửi đánh giá',
              expand: false,
              loading: _submitting,
              onPressed: _submitting ? null : _submit,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final reviews = ref.watch(assetReviewsProvider(widget.assetId));
    final isLoggedIn = ref.watch(authProvider).isLoggedIn;

    return reviews.when(
      data: (items) {
        final ownReview = items.where((r) => r.isOwn).firstOrNull;
        final canCompose = isLoggedIn && ownReview == null;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              title: 'Đánh giá',
              subtitle: items.isEmpty ? 'Chưa có đánh giá' : '${items.length} đánh giá',
              compact: true,
            ),
            if (items.isEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.lg,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Text(
                    'Chưa có đánh giá nào. Hãy là người đầu tiên!',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.mutedForeground,
                        ),
                  ),
                ),
              ),
            ...items.take(5).map(
                  (r) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: _reviewCard(r),
                  ),
                ),
            if (canCompose) ...[
              const SizedBox(height: AppSpacing.lg),
              _composeForm(),
            ],
          ],
        );
      },
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
        child: LinearProgressIndicator(color: AppColors.primary),
      ),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

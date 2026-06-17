import 'dart:async';
import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/error_messages.dart';
import '../../models/commerce_models.dart';
import '../../providers/service_providers.dart';
import '../../widgets/common_widgets.dart';

class UserAssetDetailScreen extends ConsumerStatefulWidget {
  const UserAssetDetailScreen({super.key, required this.assetId});

  final String assetId;

  @override
  ConsumerState<UserAssetDetailScreen> createState() =>
      _UserAssetDetailScreenState();
}

class _UserAssetDetailScreenState extends ConsumerState<UserAssetDetailScreen> {
  UserAssetDetail? _detail;
  bool _loading = true;
  bool _downloading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final svc = await ref.read(userAssetServiceProvider.future);
      final d = await svc.fetchDetail(widget.assetId);
      setState(() {
        _detail = d;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = friendlyErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _download() async {
    if (_detail == null || _downloading) return;
    setState(() => _downloading = true);
    try {
      final svc = await ref.read(userAssetServiceProvider.future);
      await svc.registerDownload(widget.assetId);
      final bytes = await svc.downloadFileBytes(widget.assetId);
      final dir = await getTemporaryDirectory();
      final name = _detail!.primaryFileName ?? '${_detail!.slug}.zip';
      final file = File('${dir.path}/$name');
      await file.writeAsBytes(bytes);
      await Share.shareXFiles([XFile(file.path)], text: _detail!.title);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tải xong — chọn nơi lưu file')),
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
      if (mounted) setState(() => _downloading = false);
    }
  }

  Future<void> _remove() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xóa khỏi thư viện?'),
        content: const Text('Asset sẽ bị gỡ khỏi thư viện của bạn.'),
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
    try {
      final svc = await ref.read(userAssetServiceProvider.future);
      await svc.removeFromLibrary(widget.assetId);
      ref.invalidate(userAssetsListProvider);
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(friendlyErrorMessage(e))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết thư viện')),
      body: _loading
          ? const LoadingView(message: 'Đang tải asset...')
          : _error != null
              ? ErrorState(
                  error: _error!,
                  title: 'Không tải được asset',
                  onRetry: _load,
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.page,
                    AppSpacing.sm,
                    AppSpacing.page,
                    110,
                  ),
                  children: [
                    if (_detail!.thumbnailUrl != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        child: CachedNetworkImage(
                          imageUrl: _detail!.thumbnailUrl!,
                          height: 200,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      _detail!.title,
                      style:
                          Theme.of(context).primaryTextTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _detail!.categoryName,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                    if (_detail!.shortDescription != null &&
                        _detail!.shortDescription!.trim().isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.lg),
                      const SectionHeader(title: 'Mô tả', compact: true),
                      Text(
                        _detail!.shortDescription!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              height: 1.5,
                              color: AppColors.mutedForeground,
                            ),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.xl),
                    AppCard(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Column(
                        children: [
                          _InfoRow(
                            icon: Icons.card_giftcard_outlined,
                            label: 'Cách nhận',
                            value: _detail!.acquiredVia,
                          ),
                          const Divider(color: AppColors.border),
                          _InfoRow(
                            icon: Icons.download_done_rounded,
                            label: 'Đã tải',
                            value: '${_detail!.downloadCount} lần',
                          ),
                          if (_detail!.fileSizeBytes != null) ...[
                            const Divider(color: AppColors.border),
                            _InfoRow(
                              icon: Icons.folder_zip_outlined,
                              label: 'Kích thước',
                              value: _formatBytes(_detail!.fileSizeBytes!),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    OutlinedButton.icon(
                      onPressed: _remove,
                      icon: const Icon(Icons.delete_outline_rounded,
                          color: AppColors.destructive),
                      label: const Text(
                        'Xóa khỏi thư viện',
                        style: TextStyle(color: AppColors.destructive),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.destructive),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ],
                ),
      bottomNavigationBar: _detail == null || _loading || _error != null
          ? null
          : Material(
              color: AppColors.background.withValues(alpha: 0.97),
              child: Container(
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: AppColors.border)),
                ),
                child: SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.page,
                      AppSpacing.md,
                      AppSpacing.page,
                      AppSpacing.md,
                    ),
                    child: GradientCtaButton(
                      label: 'Tải xuống / Chia sẻ',
                      icon: Icons.download_rounded,
                      loading: _downloading,
                      onPressed: _downloading ? null : _download,
                    ),
                  ),
                ),
              ),
            ),
    );
  }

  String _formatBytes(int b) {
    if (b < 1024) return '$b B';
    if (b < 1024 * 1024) return '${(b / 1024).toStringAsFixed(1)} KB';
    return '${(b / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.primary),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.mutedForeground,
                      ),
                ),
                Text(
                  value,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

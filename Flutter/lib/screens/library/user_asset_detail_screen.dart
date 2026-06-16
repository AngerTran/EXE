import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/theme/app_colors.dart';
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
        _error = e.toString();
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
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
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
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xóa', style: TextStyle(color: AppColors.destructive)),
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
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết thư viện')),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _error != null
              ? EmptyState(
                  icon: Icons.error_outline,
                  title: 'Không tải được',
                  subtitle: _error,
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_detail!.thumbnailUrl != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: CachedNetworkImage(
                          imageUrl: _detail!.thumbnailUrl!,
                          height: 180,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                    const SizedBox(height: 16),
                    Text(
                      _detail!.title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    Text(_detail!.categoryName,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.mutedForeground,
                            )),
                    if (_detail!.shortDescription != null) ...[
                      const SizedBox(height: 12),
                      Text(_detail!.shortDescription!),
                    ],
                    const SizedBox(height: 16),
                    _InfoRow(
                      label: 'Cách nhận',
                      value: _detail!.acquiredVia,
                    ),
                    _InfoRow(
                      label: 'Đã tải',
                      value: '${_detail!.downloadCount} lần',
                    ),
                    if (_detail!.fileSizeBytes != null)
                      _InfoRow(
                        label: 'Kích thước',
                        value: _formatBytes(_detail!.fileSizeBytes!),
                      ),
                    const SizedBox(height: 20),
                    GradientCtaButton(
                      label: 'Tải xuống / Chia sẻ',
                      icon: Icons.download,
                      loading: _downloading,
                      onPressed: _downloading ? null : _download,
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: _remove,
                      icon: const Icon(Icons.delete_outline,
                          color: AppColors.destructive),
                      label: const Text('Xóa khỏi thư viện',
                          style: TextStyle(color: AppColors.destructive)),
                    ),
                  ],
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
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.mutedForeground,
                    )),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
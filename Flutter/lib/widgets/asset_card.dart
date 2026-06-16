import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/theme/app_colors.dart';
import '../models/asset_models.dart';

class AssetCard extends StatelessWidget {
  const AssetCard({
    super.key,
    required this.asset,
    required this.onTap,
  });

  final AssetListItem asset;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.55),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 16 / 10,
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(15),
                  ),
                  child: _Thumbnail(url: asset.thumbnailUrl),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      asset.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      asset.categoryName,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.star_rounded,
                          size: 14,
                          color: AppColors.warning,
                        ),
                        const SizedBox(width: 2),
                        Text(
                          asset.ratingAvg.toStringAsFixed(1),
                          style: Theme.of(context).textTheme.labelSmall,
                        ),
                        const Spacer(),
                        _PriceChip(asset: asset),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Thumbnail extends StatelessWidget {
  const _Thumbnail({this.url});

  final String? url;

  @override
  Widget build(BuildContext context) {
    if (url == null || url!.isEmpty) {
      return Container(
        color: AppColors.border,
        child: const Center(
          child: Icon(Icons.image_outlined, color: AppColors.muted, size: 36),
        ),
      );
    }
    return CachedNetworkImage(
      imageUrl: url!,
      fit: BoxFit.cover,
      width: double.infinity,
      placeholder: (_, __) => Container(color: AppColors.border),
      errorWidget: (_, __, ___) => Container(
        color: AppColors.border,
        child: const Icon(Icons.broken_image_outlined, color: AppColors.muted),
      ),
    );
  }
}

class _PriceChip extends StatelessWidget {
  const _PriceChip({required this.asset});

  final AssetListItem asset;

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.decimalPattern('vi');
    final text = asset.isFree
        ? 'Miễn phí'
        : '${fmt.format(asset.displayPrice)} xu';
    final color = asset.isFree ? AppColors.success : AppColors.primary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

class ChatBubble extends StatelessWidget {
  const ChatBubble({
    super.key,
    required this.content,
    required this.isUser,
    this.suggestedAssets,
    this.onAssetTap,
  });

  final String content;
  final bool isUser;
  final List<({String id, String title, String? thumb})>? suggestedAssets;
  final void Function(String assetId)? onAssetTap;

  @override
  Widget build(BuildContext context) {
    final bg = isUser
        ? AppColors.primary.withValues(alpha: 0.15)
        : AppColors.card.withValues(alpha: 0.8);
    final align = isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start;

    return Column(
      crossAxisAlignment: align,
      children: [
        Container(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.sizeOf(context).width * 0.82,
          ),
          margin: const EdgeInsets.symmetric(vertical: 4),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(16),
              topRight: const Radius.circular(16),
              bottomLeft: Radius.circular(isUser ? 16 : 4),
              bottomRight: Radius.circular(isUser ? 4 : 16),
            ),
            border: Border.all(
              color: isUser
                  ? AppColors.primary.withValues(alpha: 0.3)
                  : AppColors.border,
            ),
          ),
          child: Text(
            content,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.45),
          ),
        ),
        if (suggestedAssets != null && suggestedAssets!.isNotEmpty)
          ...suggestedAssets!.map(
            (a) => Padding(
              padding: const EdgeInsets.only(top: 4, bottom: 4),
              child: Material(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  onTap: onAssetTap == null ? null : () => onAssetTap!(a.id),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: MediaQuery.sizeOf(context).width * 0.82,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: SizedBox(
                            width: 44,
                            height: 44,
                            child: a.thumb != null
                                ? CachedNetworkImage(
                                    imageUrl: a.thumb!,
                                    fit: BoxFit.cover,
                                  )
                                : Container(color: AppColors.border),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            a.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right,
                          color: AppColors.mutedForeground,
                          size: 18,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

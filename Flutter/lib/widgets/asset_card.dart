import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_tokens.dart';
import '../models/asset_models.dart';

class AssetCard extends StatelessWidget {
  const AssetCard({
    super.key,
    required this.asset,
    required this.onTap,
    this.marketplaceStyle = false,
    this.isBookmarked = false,
    this.isInCart = false,
    this.isPurchased = false,
    this.onToggleBookmark,
    this.onAddToCart,
    this.onBuyNow,
    this.onViewOwned,
  });

  final AssetListItem asset;
  final VoidCallback onTap;
  final bool marketplaceStyle;
  final bool isBookmarked;
  final bool isInCart;
  final bool isPurchased;
  final VoidCallback? onToggleBookmark;
  final VoidCallback? onAddToCart;
  final VoidCallback? onBuyNow;
  final VoidCallback? onViewOwned;

  bool get _showActions =>
      marketplaceStyle && onAddToCart != null && onBuyNow != null;

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.decimalPattern('vi');
    final body = Theme.of(context).textTheme;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          decoration: BoxDecoration(
            color: AppColors.card.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: isPurchased
                  ? AppColors.primary.withValues(alpha: 0.35)
                  : AppColors.border,
            ),
            boxShadow: marketplaceStyle
                ? [
                    BoxShadow(
                      color: isPurchased
                          ? AppColors.primary.withValues(alpha: 0.1)
                          : AppColors.primary.withValues(alpha: 0.06),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AspectRatio(
                aspectRatio: marketplaceStyle ? 16 / 9 : 16 / 10,
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(15),
                  ),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      _Thumbnail(url: asset.thumbnailUrl),
                      if (marketplaceStyle)
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 36,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.transparent,
                                  AppColors.background.withValues(alpha: 0.45),
                                ],
                              ),
                            ),
                          ),
                        ),
                      if (isPurchased)
                        Positioned(
                          top: AppSpacing.sm,
                          left: AppSpacing.sm,
                          child: const _OwnedBadge(),
                        ),
                      Positioned(
                        top: AppSpacing.sm,
                        right: AppSpacing.sm,
                        child: _Badge(
                          label: fmt.format(asset.downloadCount),
                          color: AppColors.card,
                          icon: Icons.download_rounded,
                          foreground: AppColors.foreground,
                        ),
                      ),
                      if (marketplaceStyle && onToggleBookmark != null)
                        Positioned(
                          bottom: AppSpacing.sm,
                          right: AppSpacing.sm,
                          child: _BookmarkButton(
                            isBookmarked: isBookmarked,
                            onPressed: onToggleBookmark!,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              if (marketplaceStyle)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 6),
                    child: _MarketplaceBody(
                      asset: asset,
                      fmt: fmt,
                      body: body,
                      showActions: _showActions,
                      isInCart: isInCart,
                      isPurchased: isPurchased,
                      onAddToCart: onAddToCart,
                      onBuyNow: onBuyNow,
                      onViewOwned: onViewOwned,
                    ),
                  ),
                )
              else
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: _LegacyBody(asset: asset, fmt: fmt, body: body),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MarketplaceBody extends StatelessWidget {
  const _MarketplaceBody({
    required this.asset,
    required this.fmt,
    required this.body,
    required this.showActions,
    required this.isInCart,
    required this.isPurchased,
    this.onAddToCart,
    this.onBuyNow,
    this.onViewOwned,
  });

  final AssetListItem asset;
  final NumberFormat fmt;
  final TextTheme body;
  final bool showActions;
  final bool isInCart;
  final bool isPurchased;
  final VoidCallback? onAddToCart;
  final VoidCallback? onBuyNow;
  final VoidCallback? onViewOwned;

  @override
  Widget build(BuildContext context) {
    final ratingText = asset.ratingAvg == asset.ratingAvg.roundToDouble()
        ? asset.ratingAvg.toInt().toString()
        : asset.ratingAvg.toStringAsFixed(1);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          asset.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: body.titleSmall?.copyWith(
            fontWeight: FontWeight.w700,
            color: AppColors.foreground,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          asset.categoryName,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: body.bodySmall?.copyWith(
            color: AppColors.mutedForeground,
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 6),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            _InlineMeta(
              icon: Icons.star_rounded,
              text: ratingText,
              iconColor: AppColors.warning,
            ),
            _metaDot(),
            Expanded(
              child: _InlineMeta(
                icon: Icons.person_outline_rounded,
                text: asset.uploaderName.isNotEmpty
                    ? asset.uploaderName
                    : 'AssetBox',
              ),
            ),
          ],
        ),
        const SizedBox(height: 5),
        _PriceTag(
          isFree: asset.isFree,
          label: asset.isFree
              ? 'Miễn phí'
              : '${fmt.format(asset.displayPrice)} xu',
        ),
        const Spacer(),
        if (showActions && isPurchased) ...[
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 6),
          _OwnedFooter(onTap: onViewOwned),
        ] else if (showActions && !isPurchased) ...[
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 6),
          _MarketplaceActions(
            asset: asset,
            isInCart: isInCart,
            isPurchased: isPurchased,
            onAddToCart: onAddToCart!,
            onBuyNow: onBuyNow!,
          ),
        ],
      ],
    );
  }

  Widget _metaDot() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 5),
        child: Text(
          '·',
          style: body.labelSmall?.copyWith(
            color: AppColors.muted.withValues(alpha: 0.7),
            fontSize: 12,
          ),
        ),
      );
}

class _LegacyBody extends StatelessWidget {
  const _LegacyBody({
    required this.asset,
    required this.fmt,
    required this.body,
  });

  final AssetListItem asset;
  final NumberFormat fmt;
  final TextTheme body;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          asset.title,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: body.titleSmall?.copyWith(
            fontWeight: FontWeight.w700,
            color: AppColors.foreground,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          asset.categoryName,
          style: body.bodySmall?.copyWith(
            color: AppColors.mutedForeground,
          ),
        ),
        const Spacer(),
        _InfoRow(
          icon: Icons.person_outline_rounded,
          label: 'Tác giả',
          value: asset.uploaderName.isNotEmpty
              ? asset.uploaderName
              : 'AssetBox',
        ),
        const SizedBox(height: 4),
        _InfoRow(
          icon: Icons.star_rounded,
          label: 'Đánh giá',
          value: asset.ratingAvg.toStringAsFixed(1),
          iconColor: AppColors.warning,
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Spacer(),
            _PriceChip(asset: asset),
          ],
        ),
      ],
    );
  }
}

class _MarketplaceActions extends StatelessWidget {
  const _MarketplaceActions({
    required this.asset,
    required this.isInCart,
    required this.isPurchased,
    required this.onAddToCart,
    required this.onBuyNow,
  });

  final AssetListItem asset;
  final bool isInCart;
  final bool isPurchased;
  final VoidCallback onAddToCart;
  final VoidCallback onBuyNow;

  @override
  Widget build(BuildContext context) {
    if (isInCart) {
      return _MarketplaceButton(
        label: asset.isFree ? 'Thêm thư viện' : 'Mua ngay',
        icon: asset.isFree
            ? Icons.collections_bookmark_outlined
            : Icons.shopping_bag_outlined,
        primary: true,
        onPressed: onBuyNow,
      );
    }

    return Row(
      children: [
        Expanded(
          child: _MarketplaceButton(
            label: 'Giỏ hàng',
            compact: true,
            onPressed: onAddToCart,
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: _MarketplaceButton(
            label: asset.isFree ? 'Thư viện' : 'Mua',
            compact: true,
            primary: true,
            onPressed: onBuyNow,
          ),
        ),
      ],
    );
  }
}

class _OwnedFooter extends StatelessWidget {
  const _OwnedFooter({this.onTap});

  final VoidCallback? onTap;

  static const _ctaGradient = LinearGradient(
    colors: [AppColors.primary, AppColors.secondary],
  );

  @override
  Widget build(BuildContext context) {
    final labelStyle = Theme.of(context).textTheme.labelSmall?.copyWith(
          color: AppColors.primaryForeground,
          fontWeight: FontWeight.w700,
          fontSize: 11,
        );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Ink(
          height: 32,
          decoration: BoxDecoration(
            gradient: _ctaGradient,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.5),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.folder_special_rounded,
                size: 14,
                color: AppColors.primaryForeground,
              ),
              const SizedBox(width: 5),
              Text('Mở thư viện', style: labelStyle),
              Icon(
                Icons.chevron_right_rounded,
                size: 16,
                color: AppColors.primaryForeground.withValues(alpha: 0.85),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MarketplaceButton extends StatelessWidget {
  const _MarketplaceButton({
    required this.label,
    this.icon,
    this.primary = false,
    this.compact = false,
    this.onPressed,
  });

  final String label;
  final IconData? icon;
  final bool primary;
  final bool compact;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final active = onPressed != null;
    final labelStyle = Theme.of(context).textTheme.labelSmall?.copyWith(
          fontWeight: FontWeight.w600,
          fontSize: compact ? 10 : 11,
          color: primary && active
              ? AppColors.primaryForeground
              : AppColors.foreground,
        );

    final content = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (icon != null && !compact) ...[
          Icon(
            icon,
            size: 13,
            color: primary && active
                ? AppColors.primaryForeground
                : AppColors.mutedForeground,
          ),
          const SizedBox(width: 3),
        ],
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: labelStyle,
        ),
      ],
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: active ? onPressed : null,
        borderRadius: BorderRadius.circular(8),
        child: Ink(
          height: 32,
          decoration: BoxDecoration(
            gradient: primary && active
                ? const LinearGradient(
                    colors: [AppColors.primary, AppColors.secondary],
                  )
                : null,
            color: primary
                ? null
                : AppColors.card.withValues(alpha: active ? 0.95 : 0.6),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: primary && active
                  ? AppColors.primary.withValues(alpha: 0.5)
                  : AppColors.border,
            ),
          ),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: compact ? 4 : 6),
            child: Center(
              child: compact
                  ? FittedBox(fit: BoxFit.scaleDown, child: content)
                  : content,
            ),
          ),
        ),
      ),
    );
  }
}

class _BookmarkButton extends StatelessWidget {
  const _BookmarkButton({
    required this.isBookmarked,
    required this.onPressed,
  });

  final bool isBookmarked;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        customBorder: const CircleBorder(),
        child: Ink(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isBookmarked
                ? AppColors.secondary.withValues(alpha: 0.92)
                : AppColors.background.withValues(alpha: 0.85),
            border: Border.all(
              color: isBookmarked
                  ? AppColors.secondary.withValues(alpha: 0.5)
                  : AppColors.border,
            ),
          ),
          child: Icon(
            isBookmarked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            size: 16,
            color: isBookmarked
                ? Colors.white
                : AppColors.mutedForeground,
          ),
        ),
      ),
    );
  }
}

class _OwnedBadge extends StatelessWidget {
  const _OwnedBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.background.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.65),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.check_circle_rounded,
            size: 12,
            color: AppColors.primary,
          ),
          const SizedBox(width: 4),
          Text(
            'Đã sở hữu',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({
    required this.label,
    required this.color,
    this.icon,
    this.foreground = Colors.white,
  });

  final String label;
  final Color color;
  final IconData? icon;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: icon == null ? 0.95 : 0.88),
        borderRadius: BorderRadius.circular(999),
        border: icon != null ? Border.all(color: AppColors.border) : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: foreground),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: foreground,
                  fontWeight: FontWeight.w700,
                  fontSize: 10,
                ),
          ),
        ],
      ),
    );
  }
}

class _InlineMeta extends StatelessWidget {
  const _InlineMeta({
    required this.icon,
    required this.text,
    this.iconColor,
  });

  final IconData icon;
  final String text;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: iconColor ?? AppColors.mutedForeground),
        const SizedBox(width: 3),
        Flexible(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.foreground,
                  fontWeight: FontWeight.w600,
                  fontSize: 10,
                ),
          ),
        ),
      ],
    );
  }
}

class _PriceTag extends StatelessWidget {
  const _PriceTag({required this.isFree, required this.label});

  final bool isFree;
  final String label;

  @override
  Widget build(BuildContext context) {
    final color = isFree ? AppColors.success : AppColors.warning;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.sell_outlined, size: 11, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                  fontSize: 10,
                ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.iconColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 13, color: iconColor ?? AppColors.mutedForeground),
        const SizedBox(width: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppColors.mutedForeground,
                fontSize: 11,
              ),
        ),
        const Spacer(),
        Flexible(
          child: Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.end,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.foreground,
                  fontWeight: FontWeight.w600,
                  fontSize: 11,
                ),
          ),
        ),
      ],
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
      placeholder: (_, _) => Container(color: AppColors.border),
      errorWidget: (_, _, _) => Container(
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
    final color = asset.isFree ? AppColors.success : AppColors.warning;

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
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  height: 1.45,
                  color: AppColors.foreground,
                ),
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
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.foreground,
                                ),
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

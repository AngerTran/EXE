import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// Nhãn giá asset trên Chợ — viền + icon, dùng chung marketplace & asset nổi bật.
class MarketplacePriceTag extends StatelessWidget {
  const MarketplacePriceTag({
    super.key,
    required this.isFree,
    required this.label,
  });

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

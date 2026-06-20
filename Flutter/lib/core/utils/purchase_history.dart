import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/commerce_models.dart';
import '../theme/app_colors.dart';

const profilePurchasePreviewLimit = 10;

bool isPurchaseOrder(Order order) {
  final type = order.orderType.toLowerCase();
  return type == 'asset' ||
      type == 'assets' ||
      type == 'subscription' ||
      type == 'creditpack' ||
      type == 'credit_pack';
}

bool matchesPurchaseFilter(Order order, String? filter) {
  if (filter == null) return true;
  final type = order.orderType.toLowerCase();
  switch (filter) {
    case 'asset':
      return type == 'asset' || type == 'assets';
    case 'subscription':
      return type == 'subscription';
    case 'credit':
      return type == 'creditpack' || type == 'credit_pack';
    default:
      return true;
  }
}

PurchaseHistoryStats computePurchaseStats(Iterable<Order> orders) {
  var assets = 0;
  var subscriptions = 0;
  var creditPacks = 0;
  var xuSpent = 0;

  for (final order in orders) {
    if (!order.isCompleted || !isPurchaseOrder(order)) continue;
    final type = order.orderType.toLowerCase();
    if (type == 'asset' || type == 'assets') {
      assets++;
      if (order.totalXu > 0) xuSpent += order.totalXu;
    } else if (type == 'subscription') {
      subscriptions++;
    } else if (type == 'creditpack' || type == 'credit_pack') {
      creditPacks++;
    }
  }

  return PurchaseHistoryStats(
    total: assets + subscriptions + creditPacks,
    assets: assets,
    subscriptions: subscriptions,
    creditPacks: creditPacks,
    xuSpent: xuSpent,
  );
}

Map<String, List<Order>> groupOrdersByDay(List<Order> orders) {
  final grouped = <String, List<Order>>{};
  for (final order in orders) {
    final key = _dayKey(order.createdAt);
    grouped.putIfAbsent(key, () => []).add(order);
  }
  return grouped;
}

String dayGroupLabel(String dayKey) {
  try {
    final date = DateTime.parse(dayKey);
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final day = DateTime(date.year, date.month, date.day);
    if (day == today) return 'Hôm nay';
    if (day == today.subtract(const Duration(days: 1))) return 'Hôm qua';
    return DateFormat('dd/MM/yyyy').format(date);
  } catch (_) {
    return dayKey;
  }
}

String _dayKey(String iso) {
  try {
    final d = DateTime.parse(iso).toLocal();
    return DateTime(d.year, d.month, d.day).toIso8601String();
  } catch (_) {
    return iso;
  }
}

class PurchaseHistoryStats {
  const PurchaseHistoryStats({
    required this.total,
    required this.assets,
    required this.subscriptions,
    required this.creditPacks,
    required this.xuSpent,
  });

  final int total;
  final int assets;
  final int subscriptions;
  final int creditPacks;
  final int xuSpent;
}

String purchaseOrderTitle(Order order) {
  if (order.items.isNotEmpty) {
    final name = order.items.first.itemName.trim();
    if (name.isNotEmpty) return name;
  }
  return purchaseOrderTypeLabel(order.orderType);
}

String purchaseOrderTypeLabel(String orderType) {
  switch (orderType.toLowerCase()) {
    case 'subscription':
      return 'Gói dịch vụ';
    case 'creditpack':
    case 'credit_pack':
      return 'Nạp xu';
    case 'asset':
    case 'assets':
      return 'Mua asset';
    default:
      return orderType;
  }
}

IconData purchaseOrderIcon(String orderType) {
  switch (orderType.toLowerCase()) {
    case 'subscription':
      return Icons.workspace_premium_outlined;
    case 'creditpack':
    case 'credit_pack':
      return Icons.monetization_on_outlined;
    case 'asset':
    case 'assets':
      return Icons.shopping_bag_outlined;
    default:
      return Icons.receipt_long_outlined;
  }
}

Color purchaseOrderColor(String orderType) {
  switch (orderType.toLowerCase()) {
    case 'subscription':
      return AppColors.secondary;
    case 'creditpack':
    case 'credit_pack':
      return AppColors.warning;
    case 'asset':
    case 'assets':
      return AppColors.primary;
    default:
      return AppColors.mutedForeground;
  }
}

String purchaseOrderAmountLabel(Order order) {
  final type = order.orderType.toLowerCase();
  if (type == 'asset' || type == 'assets') {
    if (order.totalXu > 0) return '-${order.totalXu} xu';
    return 'Miễn phí';
  }
  if (type == 'creditpack' || type == 'credit_pack') {
    return '+${order.totalXu} xu';
  }
  if (type == 'subscription') {
    if (order.totalXu > 0) return '${order.totalXu} xu';
    return 'Gói mới';
  }
  if (order.totalXu > 0) return '${order.totalXu} xu';
  return 'Miễn phí';
}

Color purchaseOrderAmountColor(Order order) {
  final type = order.orderType.toLowerCase();
  if (type == 'creditpack' || type == 'credit_pack') {
    return AppColors.success;
  }
  if (type == 'asset' || type == 'assets') {
    return order.totalXu > 0 ? AppColors.destructive : AppColors.success;
  }
  return AppColors.primary;
}

String formatPurchaseDateTime(String iso) {
  try {
    return DateFormat('HH:mm · dd/MM/yyyy')
        .format(DateTime.parse(iso).toLocal());
  } catch (_) {
    return iso;
  }
}

String formatPurchaseTime(String iso) {
  try {
    return DateFormat('HH:mm').format(DateTime.parse(iso).toLocal());
  } catch (_) {
    return '';
  }
}

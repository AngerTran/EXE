import 'package:intl/intl.dart';

import '../../models/billing_models.dart';

const _planCompareAtVnd = {'student': 59000};

const _featureLabels = {
  'marketplace': 'Truy cập marketplace đầy đủ — mua asset bằng xu',
  'basic_ai': 'AI advisor gợi ý asset phù hợp dự án',
  'free_assets': 'Toàn quyền tải asset miễn phí trên marketplace',
  'priority_support': 'Hỗ trợ ưu tiên qua email — phản hồi trong 24h',
  'vietnamese_docs': 'Tài liệu & hướng dẫn tiếng Việt dành cho sinh viên',
  'team': 'Quản lý team và chia sẻ thư viện asset nội bộ',
  'exclusive_packs': 'Gói asset độc quyền chỉ dành cho thành viên Pro',
  'project_review': 'Tư vấn & review dự án game 1-1 từ chuyên gia',
};

const _planDisplay = {
  'free': (
    tagline: 'Bắt đầu miễn phí — trải nghiệm AI & marketplace',
    features: [
      '100 xu tặng ngay khi đăng ký tài khoản',
      'Chat AI gợi ý asset phù hợp dự án của bạn',
      'Duyệt & mua asset trên marketplace bằng xu',
      'Hỗ trợ qua email trong giờ hành chính',
    ],
  ),
  'student': (
    tagline: 'Giá sinh viên — lý tưởng cho CNTT, Game & Multimedia',
    features: [
      '1.000 xu được cấp mỗi tháng — đủ cho ~1.000 lượt chat',
      'Gợi ý asset thông minh theo thể loại & engine game',
      'Truy cập đầy đủ marketplace — asset miễn phí & trả phí',
      'Tài liệu tiếng Việt & hỗ trợ email ưu tiên 24h',
    ],
  ),
  'pro': (
    tagline: 'Dành cho indie dev, studio nhỏ & chuyên gia',
    features: [
      'Xu không giới hạn — chat thoải mái không lo hết xu',
      'AI advisor nâng cao — phân tích dự án chi tiết hơn',
      'Gói asset độc quyền & ưu tiên cập nhật nội dung mới',
      'Hỗ trợ ưu tiên — phản hồi trong vòng 2 giờ làm việc',
    ],
  ),
};

bool _looksLikeFeatureKey(String value) =>
    RegExp(r'^[a-z][a-z0-9_]*$').hasMatch(value.trim());

String formatFeatureLabel(String raw) {
  final key = raw.trim();
  return _featureLabels[key] ?? key.replaceAll('_', ' ');
}

List<String> resolvePlanFeatures(SubscriptionPlan plan) {
  final fallback = _planDisplay[plan.slug]?.features ?? [];
  if (plan.features.isEmpty) return fallback;

  final mapped = plan.features.map((f) {
    return _looksLikeFeatureKey(f) ? formatFeatureLabel(f) : f.trim();
  }).toList();

  final mostlyKeys =
      plan.features.where(_looksLikeFeatureKey).length >= plan.features.length ~/ 2;
  return mostlyKeys && fallback.isNotEmpty ? fallback : mapped;
}

String resolvePlanTagline(SubscriptionPlan plan) {
  final desc = plan.description?.trim();
  if (desc != null && desc.isNotEmpty) return desc;
  return _planDisplay[plan.slug]?.tagline ?? '';
}

class PlanPriceDisplay {
  const PlanPriceDisplay({
    required this.primary,
    this.primarySuffix,
    this.secondary,
    this.highlight,
    this.compareAt,
    this.discountPercent,
  });

  final String primary;
  final String? primarySuffix;
  final String? secondary;
  final String? highlight;
  final String? compareAt;
  final int? discountPercent;
}

PlanPriceDisplay formatPlanPrice(SubscriptionPlan plan) {
  final fmt = NumberFormat.decimalPattern('vi');

  if (plan.slug == 'free' || plan.priceVnd == 0) {
    return PlanPriceDisplay(
      primary: '0đ',
      primarySuffix: '/tháng',
      secondary: plan.creditsMonthly != null
          ? '${fmt.format(plan.creditsMonthly)} xu tặng một lần khi đăng ký'
          : 'Tự động kích hoạt khi tạo tài khoản',
      highlight: 'Đã bao gồm với mọi tài khoản mới',
    );
  }

  if (plan.isUnlimited) {
    return PlanPriceDisplay(
      primary: '${fmt.format(plan.priceVnd)}đ',
      primarySuffix: '/tháng',
      secondary: 'Thanh toán chuyển khoản — kích hoạt sau xác nhận',
      highlight: 'Xu không giới hạn',
    );
  }

  final compareAt = _planCompareAtVnd[plan.slug];
  final hasPromo = compareAt != null && compareAt > plan.priceVnd;
  final discount = hasPromo
      ? (((compareAt - plan.priceVnd) / compareAt) * 100).round()
      : null;

  return PlanPriceDisplay(
    primary: '${fmt.format(plan.priceVnd)}đ',
    primarySuffix: '/tháng',
    compareAt: hasPromo ? '${fmt.format(compareAt)}đ' : null,
    discountPercent: discount,
    secondary: plan.creditsMonthly != null
        ? 'Bao gồm ${fmt.format(plan.creditsMonthly)} xu mỗi tháng'
        : null,
    highlight: plan.creditsMonthly != null
        ? '${fmt.format(plan.creditsMonthly)} xu/tháng'
        : null,
  );
}

bool hasPaidSubscription(String? slug) =>
    slug != null && slug != 'free' && slug.isNotEmpty;

String formatUnitPricePer100(CreditPack pack) {
  if (pack.credits <= 0) return '';
  final per100 = (pack.priceVnd / pack.credits) * 100;
  final fmt = NumberFormat.decimalPattern('vi');
  return '${fmt.format(per100.round())}đ';
}

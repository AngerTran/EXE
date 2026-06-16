class UploadUrlResponse {
  UploadUrlResponse({
    required this.uploadUrl,
    required this.storagePath,
    required this.bucket,
    required this.expiresInSeconds,
  });

  final String uploadUrl;
  final String storagePath;
  final String bucket;
  final int expiresInSeconds;

  factory UploadUrlResponse.fromJson(Map<String, dynamic> json) =>
      UploadUrlResponse(
        uploadUrl: json['uploadUrl'] as String,
        storagePath: json['storagePath'] as String,
        bucket: json['bucket'] as String? ?? '',
        expiresInSeconds: json['expiresInSeconds'] as int? ?? 0,
      );
}

class SupabasePublicConfig {
  SupabasePublicConfig({required this.url, required this.anonKey});

  final String url;
  final String anonKey;

  factory SupabasePublicConfig.fromJson(Map<String, dynamic> json) =>
      SupabasePublicConfig(
        url: (json['url'] as String).replaceAll(RegExp(r'/$'), ''),
        anonKey: json['anonKey'] as String,
      );
}

class MeWallet {
  MeWallet({required this.balance, required this.isUnlimited});

  final int balance;
  final bool isUnlimited;

  factory MeWallet.fromJson(Map<String, dynamic> json) => MeWallet(
        balance: (json['balance'] as num?)?.toInt() ?? 0,
        isUnlimited: json['isUnlimited'] as bool? ?? false,
      );
}

class MeSubscription {
  MeSubscription({
    required this.plan,
    required this.status,
    this.expiredAt,
  });

  final String plan;
  final String status;
  final String? expiredAt;

  factory MeSubscription.fromJson(Map<String, dynamic> json) => MeSubscription(
        plan: json['plan'] as String? ?? 'free',
        status: json['status'] as String? ?? '',
        expiredAt: json['expiredAt'] as String?,
      );
}

class MeResponse {
  MeResponse({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.avatarUrl,
    required this.wallet,
    required this.subscription,
  });

  final String id;
  final String email;
  final String name;
  final String role;
  final String? avatarUrl;
  final MeWallet wallet;
  final MeSubscription subscription;

  bool get isAdmin => role == 'admin';

  factory MeResponse.fromJson(Map<String, dynamic> json) => MeResponse(
        id: json['id'] as String,
        email: json['email'] as String,
        name: json['name'] as String? ?? json['username'] as String? ?? '',
        role: json['role'] as String? ?? 'customer',
        avatarUrl: json['avatarUrl'] as String?,
        wallet: MeWallet.fromJson(
          json['wallet'] as Map<String, dynamic>? ?? {},
        ),
        subscription: MeSubscription.fromJson(
          json['subscription'] as Map<String, dynamic>? ?? {},
        ),
      );
}

class AuthSessionResponse {
  AuthSessionResponse({
    this.accessToken,
    this.refreshToken,
    required this.expiresIn,
    required this.user,
    this.requiresEmailConfirmation,
  });

  final String? accessToken;
  final String? refreshToken;
  final int expiresIn;
  final Map<String, dynamic> user;
  final bool? requiresEmailConfirmation;

  factory AuthSessionResponse.fromJson(Map<String, dynamic> json) =>
      AuthSessionResponse(
        accessToken: json['accessToken'] as String?,
        refreshToken: json['refreshToken'] as String?,
        expiresIn: json['expiresIn'] as int? ?? 0,
        user: json['user'] as Map<String, dynamic>? ?? {},
        requiresEmailConfirmation: json['requiresEmailConfirmation'] as bool?,
      );
}

class AppUser {
  AppUser({
    required this.id,
    required this.email,
    required this.name,
    required this.credits,
    required this.isUnlimited,
    required this.role,
    required this.subscription,
    this.subscriptionExpiry,
    this.avatarUrl,
  });

  final String id;
  final String email;
  final String name;
  final int credits;
  final bool isUnlimited;
  final String role;
  final String subscription;
  final String? subscriptionExpiry;
  final String? avatarUrl;

  static AppUser fromMe(MeResponse me) => AppUser(
        id: me.id,
        email: me.email,
        name: me.name,
        credits: me.wallet.balance,
        isUnlimited: me.wallet.isUnlimited,
        role: me.role,
        subscription: me.subscription.plan,
        subscriptionExpiry: me.subscription.expiredAt,
        avatarUrl: me.avatarUrl,
      );
}

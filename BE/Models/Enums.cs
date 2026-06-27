using NpgsqlTypes;

namespace Exe.Models;

public enum UserRole
{
    [PgName("customer")] Customer,
    [PgName("seller")] Seller,
    [PgName("admin")] Admin
}

public enum UserStatus
{
    [PgName("active")] Active,
    [PgName("banned")] Banned,
    [PgName("pending")] Pending
}

public enum SubscriptionTier
{
    [PgName("free")] Free,
    [PgName("student")] Student,
    [PgName("indie")] Indie,
    [PgName("pro")] Pro
}

public enum SubscriptionStatus
{
    [PgName("active")] Active,
    [PgName("expired")] Expired,
    [PgName("cancelled")] Cancelled,
    [PgName("pending")] Pending
}

public enum WalletTxType
{
    [PgName("AI_USAGE")] AiUsage,
    [PgName("PURCHASE")] Purchase,
    [PgName("REFUND")] Refund,
    [PgName("BONUS")] Bonus,
    [PgName("ASSET_PURCHASE")] AssetPurchase,
    [PgName("SUBSCRIPTION_GRANT")] SubscriptionGrant,
    [PgName("SELLER_SALE")] SellerSale,
    [PgName("SELLER_PAYOUT")] SellerPayout
}

public enum PaymentStatus
{
    [PgName("pending")] Pending,
    [PgName("completed")] Completed,
    [PgName("failed")] Failed,
    [PgName("refunded")] Refunded
}

public enum PaymentMethod
{
    [PgName("momo")] Momo,
    [PgName("bank_transfer")] BankTransfer,
    [PgName("credit_card")] CreditCard,
    [PgName("vnpay")] Vnpay
}

public enum OrderType
{
    [PgName("asset")] Asset,
    [PgName("subscription")] Subscription,
    [PgName("credit_pack")] CreditPack
}

public enum OrderStatus
{
    [PgName("pending")] Pending,
    [PgName("completed")] Completed,
    [PgName("cancelled")] Cancelled,
    [PgName("refunded")] Refunded
}

public enum AssetStatus
{
    [PgName("draft")] Draft,
    [PgName("pending_review")] PendingReview,
    [PgName("approved")] Approved,
    [PgName("rejected")] Rejected
}

public enum PriceType
{
    [PgName("free")] Free,
    [PgName("paid")] Paid
}

public enum LicenseType
{
    [PgName("standard")] Standard,
    [PgName("cc0")] Cc0,
    [PgName("royalty_free")] RoyaltyFree
}

public enum ArtStyle
{
    [PgName("pixel_art")] PixelArt,
    [PgName("low_poly")] LowPoly,
    [PgName("anime")] Anime,
    [PgName("realistic")] Realistic,
    [PgName("stylized")] Stylized,
    [PgName("cartoon")] Cartoon,
    [PgName("hand_painted")] HandPainted,
    [PgName("minimalist")] Minimalist,
    [PgName("retro")] Retro,
    [PgName("cyberpunk")] Cyberpunk,
    [PgName("sci_fi")] SciFi
}

public enum AiMessageRole
{
    [PgName("user")] User,
    [PgName("assistant")] Assistant,
    [PgName("system")] System
}

public enum NotificationLevel
{
    [PgName("info")] Info,
    [PgName("success")] Success,
    [PgName("warning")] Warning,
    [PgName("error")] Error
}

public enum NotificationCategory
{
    [PgName("subscription")] Subscription,
    [PgName("wallet")] Wallet,
    [PgName("order")] Order,
    [PgName("asset")] Asset,
    [PgName("admin")] Admin,
    [PgName("account")] Account,
    [PgName("ai")] Ai
}

public enum SellerStatus
{
    [PgName("pending")] Pending,
    [PgName("active")] Active,
    [PgName("suspended")] Suspended
}

public enum SellerApplicationStatus
{
    [PgName("pending")] Pending,
    [PgName("approved")] Approved,
    [PgName("rejected")] Rejected
}

public enum SellerEarningStatus
{
    [PgName("pending")] Pending,
    [PgName("available")] Available,
    [PgName("paid_out")] PaidOut
}

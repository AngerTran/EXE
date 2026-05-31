using Exe.Models;

namespace Exe.Models.Entities;

public class Asset
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? ShortDescription { get; set; }
    public string? FullDescription { get; set; }
    public Guid CategoryId { get; set; }
    public Guid UploaderId { get; set; }
    public ArtStyle? ArtStyle { get; set; }
    public PriceType PriceType { get; set; } = PriceType.Free;
    public long PriceVnd { get; set; }
    public int PriceXu { get; set; }
    public LicenseType License { get; set; } = LicenseType.Standard;
    public AssetStatus Status { get; set; } = AssetStatus.PendingReview;
    public string? RejectionReason { get; set; }
    public bool EngineUnity { get; set; } = true;
    public bool EngineUnreal { get; set; }
    public bool EngineGodot { get; set; }
    public bool FeatureRigged { get; set; }
    public bool FeatureAnimated { get; set; }
    public bool FeaturePbr { get; set; }
    public bool FeatureVrReady { get; set; }
    public string? Version { get; set; }
    public string? UnityVersion { get; set; }
    public long? FileSizeBytes { get; set; }
    public string? PolygonCount { get; set; }
    public string? TextureResolution { get; set; }
    public decimal RatingAvg { get; set; }
    public int RatingCount { get; set; }
    public int DownloadCount { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public Category Category { get; set; } = null!;
    public Profile Uploader { get; set; } = null!;
    public Profile? Approver { get; set; }
    public ICollection<AssetFile> Files { get; set; } = [];
    public ICollection<AssetImage> Images { get; set; } = [];
    public ICollection<AssetTag> AssetTags { get; set; } = [];
    public ICollection<AssetReview> Reviews { get; set; } = [];
    public ICollection<Bookmark> Bookmarks { get; set; } = [];
    public ICollection<CartItem> CartItems { get; set; } = [];
    public ICollection<OrderItem> OrderItems { get; set; } = [];
    public ICollection<UserAsset> UserAssets { get; set; } = [];
    public ICollection<AiMessageAsset> AiMessageAssets { get; set; } = [];
}

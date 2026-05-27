import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Package,
  Download,
  Search,
  Filter,
  Calendar,
  Star,
  ExternalLink,
  FileText,
  Image,
  Music,
  Video,
  Folder,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface PurchasedAsset {
  id: string;
  title: string;
  category: string;
  price: number;
  purchaseDate: string;
  downloadCount: number;
  fileSize: string;
  fileType: string;
}

export default function MyAssets() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [purchasedAssets, setPurchasedAssets] = useState<PurchasedAsset[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<PurchasedAsset | null>(null);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`purchased_assets_${user.id}`);
      if (saved) {
        setPurchasedAssets(JSON.parse(saved));
      }
    }
  }, [user]);

  const categories = [
    { id: "all", label: "Tất cả", icon: <Folder className="w-4 h-4" /> },
    { id: "2D Characters", label: "2D Characters", icon: <Image className="w-4 h-4" /> },
    { id: "2D Environments", label: "2D Environments", icon: <Image className="w-4 h-4" /> },
    { id: "UI/UX", label: "UI/UX", icon: <FileText className="w-4 h-4" /> },
    { id: "Sound Effects", label: "Sound Effects", icon: <Music className="w-4 h-4" /> },
    { id: "Music", label: "Music", icon: <Music className="w-4 h-4" /> },
    { id: "3D Models", label: "3D Models", icon: <Package className="w-4 h-4" /> },
    { id: "Animations", label: "Animations", icon: <Video className="w-4 h-4" /> },
  ];

  const filteredAssets = purchasedAssets.filter((asset) => {
    const matchesSearch = asset.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (asset: PurchasedAsset) => {
    setSelectedAsset(asset);
    setShowDownloadModal(true);

    // Update download count
    const updatedAssets = purchasedAssets.map((a) =>
      a.id === asset.id ? { ...a, downloadCount: a.downloadCount + 1 } : a
    );
    setPurchasedAssets(updatedAssets);
    if (user) {
      localStorage.setItem(
        `purchased_assets_${user.id}`,
        JSON.stringify(updatedAssets)
      );
    }
  };

  const totalSpent = purchasedAssets.reduce((sum, asset) => sum + asset.price, 0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8">
            <Package className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Vui lòng đăng nhập
            </h2>
            <p className="text-muted-foreground mb-6">
              Đăng nhập để xem thư viện assets của bạn
            </p>
            <Link
              to="/auth"
              className="inline-block bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                Thư viện của tôi
              </h1>
              <p className="text-muted-foreground">
                Quản lý và tải xuống các assets bạn đã mua
              </p>
            </div>
            <Link
              to="/marketplace"
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.5)]"
            >
              Khám phá thêm
            </Link>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tổng assets</p>
                  <p className="text-2xl font-bold text-foreground font-mono">
                    {purchasedAssets.length}
                  </p>
                </div>
                <div className="bg-primary/20 border border-primary/30 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tổng chi tiêu</p>
                  <p className="text-2xl font-bold text-foreground font-mono">
                    {totalSpent.toLocaleString("vi-VN")}đ
                  </p>
                </div>
                <div className="bg-success/20 border border-success/30 p-3 rounded-lg">
                  <Download className="w-6 h-6 text-success" />
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lượt tải</p>
                  <p className="text-2xl font-bold text-foreground font-mono">
                    {purchasedAssets.reduce(
                      (sum, asset) => sum + asset.downloadCount,
                      0
                    )}
                  </p>
                </div>
                <div className="bg-warning/20 border border-warning/30 p-3 rounded-lg">
                  <Star className="w-6 h-6 text-warning" />
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-12 max-w-md mx-auto">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                {purchasedAssets.length === 0
                  ? "Chưa có assets nào"
                  : "Không tìm thấy kết quả"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {purchasedAssets.length === 0
                  ? "Hãy khám phá marketplace để tìm assets phù hợp với dự án của bạn"
                  : "Thử tìm kiếm với từ khóa khác"}
              </p>
              <Link
                to="/marketplace"
                className="inline-block bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
              >
                Đi tới Marketplace
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-5 hover:scale-105 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)] transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1 line-clamp-2">
                      {asset.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{asset.category}</p>
                  </div>
                  <span className="px-2 py-1 bg-success/10 border border-success/30 text-success rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Đã mua
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Mua ngày:
                    </span>
                    <span className="font-medium text-foreground font-mono">{asset.purchaseDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      Đã tải:
                    </span>
                    <span className="font-medium text-foreground font-mono">{asset.downloadCount} lần</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Dung lượng:</span>
                    <span className="font-medium text-foreground font-mono">{asset.fileSize}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleDownload(asset)}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-2 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Tải xuống
                  </button>
                  <button className="w-full bg-card hover:bg-card/80 border border-border hover:border-primary/50 text-foreground py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Download Modal */}
      {showDownloadModal && selectedAsset && (
        <DownloadModal
          asset={selectedAsset}
          onClose={() => {
            setShowDownloadModal(false);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
}

function DownloadModal({
  asset,
  onClose,
}: {
  asset: PurchasedAsset;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = () => {
    setDownloading(true);
    setProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloading(false);
            // In real app, trigger actual file download here
            alert(
              `✅ Đã tải xuống "${asset.title}" thành công!\n\nTrong ứng dụng thực tế, file sẽ được tải về máy của bạn.`
            );
            onClose();
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background border border-border rounded-xl p-6 z-50 shadow-2xl">
        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Download className="w-6 h-6 text-primary" />
          Tải xuống Asset
        </h3>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h4 className="font-bold text-foreground text-lg mb-4">{asset.title}</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Danh mục:</span>
              <span className="text-foreground font-medium">{asset.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Định dạng:</span>
              <span className="text-foreground font-medium font-mono">{asset.fileType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dung lượng:</span>
              <span className="text-foreground font-medium font-mono">{asset.fileSize}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ngày mua:</span>
              <span className="text-foreground font-medium font-mono">{asset.purchaseDate}</span>
            </div>
          </div>
        </div>

        {downloading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Đang tải xuống...</span>
              <span className="text-sm font-bold text-primary font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-300 shadow-[0_0_10px_rgba(0,217,255,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
          <p className="text-foreground text-sm">
            💡 <strong>Lưu ý:</strong> Bạn có quyền sử dụng asset này cho dự án
            cá nhân và thương mại. Không được phân phối lại hoặc bán asset này.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={downloading}
            className="flex-1 bg-card hover:bg-card/80 border border-border text-foreground py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Đóng
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {downloading ? "Đang tải..." : "Tải xuống"}
          </button>
        </div>
      </div>
    </>
  );
}

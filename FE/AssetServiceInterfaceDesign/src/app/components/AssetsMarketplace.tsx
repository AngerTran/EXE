import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Filter,
  ShoppingCart,
  Star,
  Eye,
  X,
  Trash2,
  ArrowRight,
  ShoppingBag,
  CheckCircle,
  Loader2,
  Library,
  Download,
  ExternalLink,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { ClientPagination } from "./ui/ClientPagination";
import { toast } from "sonner";
import { ApiError } from "../../api/client";
import { fetchAssets, fetchAssetById } from "../../api/assets";
import { fetchCategories } from "../../api/lookup";
import { fetchCart, addCartItem, removeCartItem } from "../../api/cart";
import { fetchUserAssets } from "../../api/userAssets";
import { mapAssetListItem, type MarketplaceAsset } from "../../api/mappers";
import type { CategoryItem } from "../../api/types/marketplace";
import type { CartItem } from "../../api/types/commerce";

export type Asset = MarketplaceAsset;

// Mock data (fallback / legacy export)
export const mockAssets: Asset[] = [
  {
    id: "1",
    title: "Fantasy Character Pack",
    category: "2D Characters",
    price: 149000,
    rating: 4.8,
    downloads: 1234,
    preview: "fantasy warrior character",
    author: "ArtStudio",
    tags: ["RPG", "Fantasy", "Sprite"],
    isFree: false,
  },
  {
    id: "2",
    title: "Pixel Forest Tileset",
    category: "2D Environments",
    price: 0,
    rating: 4.5,
    downloads: 5678,
    preview: "pixel art forest",
    author: "PixelMaster",
    tags: ["Pixel Art", "Tileset", "Nature"],
    isFree: true,
  },
  {
    id: "3",
    title: "Modern UI Kit",
    category: "UI/UX",
    price: 99000,
    rating: 4.9,
    downloads: 3456,
    preview: "game user interface",
    author: "UIDesigner",
    tags: ["Modern", "Clean", "Buttons"],
    isFree: false,
  },
  {
    id: "4",
    title: "Platformer Hero Sprites",
    category: "2D Characters",
    price: 0,
    rating: 4.6,
    downloads: 8901,
    preview: "platformer game character",
    author: "GameArtist",
    tags: ["Platformer", "Run", "Jump"],
    isFree: true,
  },
  {
    id: "5",
    title: "Sci-Fi Sound Pack",
    category: "Sound Effects",
    price: 199000,
    rating: 4.7,
    downloads: 2345,
    preview: "sound wave visualization",
    author: "SoundPro",
    tags: ["Sci-Fi", "Laser", "Explosion"],
    isFree: false,
  },
  {
    id: "6",
    title: "Casual Game Music",
    category: "Music",
    price: 0,
    rating: 4.4,
    downloads: 4567,
    preview: "music notes background",
    author: "MusicComposer",
    tags: ["Casual", "Loop", "Happy"],
    isFree: true,
  },
  {
    id: "7",
    title: "Low Poly Nature Pack",
    category: "3D Models",
    price: 299000,
    rating: 4.9,
    downloads: 1890,
    preview: "low poly trees",
    author: "3DArtist",
    tags: ["Low Poly", "Nature", "Trees"],
    isFree: false,
  },
  {
    id: "8",
    title: "Particle Effects Collection",
    category: "Particles",
    price: 0,
    rating: 4.6,
    downloads: 6789,
    preview: "particle effect explosion",
    author: "VFXMaster",
    tags: ["Fire", "Smoke", "Magic"],
    isFree: true,
  },
  {
    id: "9",
    title: "Zombie Character Set",
    category: "2D Characters",
    price: 179000,
    rating: 4.8,
    downloads: 2890,
    preview: "zombie character sprite",
    author: "HorrorArts",
    tags: ["Zombie", "Horror", "Animated"],
    isFree: false,
  },
  {
    id: "10",
    title: "Medieval Castle Tileset",
    category: "2D Environments",
    price: 249000,
    rating: 4.9,
    downloads: 1567,
    preview: "medieval castle tiles",
    author: "CastleBuilder",
    tags: ["Medieval", "Castle", "Stone"],
    isFree: false,
  },
  {
    id: "11",
    title: "Cyberpunk UI Elements",
    category: "UI/UX",
    price: 0,
    rating: 4.5,
    downloads: 4321,
    preview: "cyberpunk interface",
    author: "NeonDesign",
    tags: ["Cyberpunk", "Neon", "Futuristic"],
    isFree: true,
  },
  {
    id: "12",
    title: "Space Shooter Ship Pack",
    category: "2D Characters",
    price: 169000,
    rating: 4.7,
    downloads: 3210,
    preview: "spaceship sprite",
    author: "SpaceArtist",
    tags: ["Space", "Shooter", "Ships"],
    isFree: false,
  },
  {
    id: "13",
    title: "Retro Arcade Sprites",
    category: "2D Characters",
    price: 0,
    rating: 4.6,
    downloads: 7890,
    preview: "retro pixel game sprites",
    author: "RetroPixel",
    tags: ["Retro", "Arcade", "8-bit"],
    isFree: true,
  },
  {
    id: "14",
    title: "Horror Ambience Sounds",
    category: "Sound Effects",
    price: 159000,
    rating: 4.8,
    downloads: 2156,
    preview: "horror sound waves",
    author: "DarkAudio",
    tags: ["Horror", "Ambient", "Scary"],
    isFree: false,
  },
  {
    id: "15",
    title: "Tropical Island Tileset",
    category: "2D Environments",
    price: 189000,
    rating: 4.9,
    downloads: 4321,
    preview: "tropical island tiles",
    author: "IslandCreator",
    tags: ["Tropical", "Beach", "Island"],
    isFree: false,
  },
  {
    id: "16",
    title: "Weapon Icons Pack",
    category: "UI/UX",
    price: 0,
    rating: 4.7,
    downloads: 9876,
    preview: "game weapon icons",
    author: "IconMaster",
    tags: ["Weapons", "Icons", "UI"],
    isFree: true,
  },
  {
    id: "17",
    title: "Epic Battle Music",
    category: "Music",
    price: 229000,
    rating: 4.9,
    downloads: 1678,
    preview: "epic orchestral music",
    author: "EpicComposer",
    tags: ["Epic", "Battle", "Orchestral"],
    isFree: false,
  },
  {
    id: "18",
    title: "Cartoon Character Bundle",
    category: "2D Characters",
    price: 199000,
    rating: 4.8,
    downloads: 5432,
    preview: "cartoon character sprites",
    author: "CartoonStudio",
    tags: ["Cartoon", "Cute", "Colorful"],
    isFree: false,
  },
  {
    id: "19",
    title: "Magic Spell Effects",
    category: "Animations",
    price: 0,
    rating: 4.7,
    downloads: 8765,
    preview: "magic spell animation",
    author: "SpellAnimator",
    tags: ["Magic", "Spells", "Effects"],
    isFree: true,
  },
  {
    id: "20",
    title: "Steampunk Machinery",
    category: "3D Models",
    price: 349000,
    rating: 4.9,
    downloads: 1234,
    preview: "steampunk gears machine",
    author: "SteamMechanic",
    tags: ["Steampunk", "Mechanical", "Gears"],
    isFree: false,
  },
  {
    id: "21",
    title: "Desert Environment Pack",
    category: "2D Environments",
    price: 219000,
    rating: 4.8,
    downloads: 3456,
    preview: "desert sand dunes",
    author: "DesertMaker",
    tags: ["Desert", "Sand", "Arid"],
    isFree: false,
  },
  {
    id: "22",
    title: "Healing & Buff Sounds",
    category: "Sound Effects",
    price: 0,
    rating: 4.6,
    downloads: 6543,
    preview: "healing sound effects",
    author: "PositiveSFX",
    tags: ["Healing", "Buff", "Positive"],
    isFree: true,
  },
];

export default function AssetsMarketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [page, setPage] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [purchasedAssetIds, setPurchasedAssetIds] = useState<string[]>([]);
  const [highlightedAssetId, setHighlightedAssetId] = useState<string | null>(null);
  const [assets, setAssets] = useState<MarketplaceAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MarketplaceAsset | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 12;

  const categoryNames = ["Tất cả", ...categories.map((c) => c.name)];

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const categoryId =
        selectedCategory === "Tất cả"
          ? undefined
          : categories.find((c) => c.name === selectedCategory)?.id;
      const res = await fetchAssets({
        search: searchQuery || undefined,
        categoryId,
        priceType: priceFilter === "free" ? "free" : priceFilter === "paid" ? "paid" : undefined,
        page,
        pageSize,
        sort: "createdAt",
        order: "desc",
      });
      setAssets(res.data.map(mapAssetListItem));
      setTotalPages(Math.max(1, Math.ceil(res.total / res.pageSize)));
    } catch {
      toast.error("Không tải được danh sách assets");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, priceFilter, page, categories]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (categories.length === 0 && selectedCategory === "Tất cả") {
      loadAssets();
    } else if (categories.length > 0) {
      loadAssets();
    }
  }, [loadAssets, categories.length]);

  const loadCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    try {
      const cart = await fetchCart();
      setCartItems(cart.items);
    } catch {
      setCartItems([]);
    }
  }, [user]);

  const loadPurchased = useCallback(async () => {
    if (!user) {
      setPurchasedAssetIds([]);
      return;
    }
    try {
      const items = await fetchUserAssets();
      setPurchasedAssetIds(items.map((i) => i.assetId));
    } catch {
      setPurchasedAssetIds([]);
    }
  }, [user]);

  useEffect(() => {
    loadCart();
    loadPurchased();
  }, [loadCart, loadPurchased]);

  // Handle highlight from URL param
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId) {
      setHighlightedAssetId(highlightId);
      
      // Scroll to the asset after a short delay to ensure rendering
      setTimeout(() => {
        const element = document.getElementById(`asset-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedAssetId(null);
      }, 3000);
    }
  }, [searchParams]);

  // Auto-open asset detail from URL param
  useEffect(() => {
    const detailsId = searchParams.get("details");
    if (!detailsId) return;

    const found = assets.find((a) => a.id === detailsId) || null;
    if (found) {
      setSelectedAsset(found);
      return;
    }
    fetchAssetById(detailsId)
      .then((d) => setSelectedAsset(mapAssetListItem(d)))
      .catch(() => {});
  }, [assets, searchParams]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery, priceFilter]);
  const addToCart = async (assetId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (cartItems.some((i) => i.assetId === assetId)) return;
    try {
      const item = await addCartItem(assetId);
      setCartItems((prev) => [...prev, item]);
      toast.success("Đã thêm vào giỏ");
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Không thêm được vào giỏ";
      toast.error(msg);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await removeCartItem(cartItemId);
      setCartItems((prev) => prev.filter((i) => i.id !== cartItemId));
    } catch {
      toast.error("Không xóa được khỏi giỏ");
    }
  };

  const cartAssetIds = cartItems.map((i) => i.assetId);
  const cartDisplayItems: MarketplaceAsset[] = cartItems.map((item) => ({
    id: item.assetId,
    title: item.asset.title,
    category: item.asset.categoryName,
    price: item.asset.isFree ? 0 : item.lineTotalVnd,
    rating: 0,
    downloads: 0,
    preview: item.asset.thumbnailUrl || item.asset.title,
    author: "",
    tags: [],
    isFree: item.asset.isFree,
    thumbnailUrl: item.asset.thumbnailUrl,
  }));
  const buyNow = (assetId: string) => {
    navigate(`/checkout-assets?assets=${assetId}`);
  };

  const totalPrice = cartDisplayItems.reduce((sum, asset) => sum + asset.price, 0);
  const freeItemsCount = cartDisplayItems.filter((asset) => asset.isFree).length;
  const paidItemsCount = cartDisplayItems.length - freeItemsCount;
  const walletBalance = user?.credits ?? 0;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigate("/checkout-assets");
  };

  return (
    <div className="min-h-[calc(100vh-200px)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
            <ShoppingBag className="w-10 h-10 text-primary" />
            Assets Marketplace
          </h1>
          <p className="text-xl text-muted-foreground">
            Kho assets miễn phí chất lượng cao cho game của bạn
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Price Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setPriceFilter("all")}
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  priceFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,217,255,0.3)]"
                    : "bg-card border border-border text-muted-foreground hover:bg-card/80 hover:text-foreground"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setPriceFilter("free")}
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  priceFilter === "free"
                    ? "bg-success text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    : "bg-card border border-border text-muted-foreground hover:bg-card/80 hover:text-foreground"
                }`}
              >
                Miễn phí
              </button>
              <button
                onClick={() => setPriceFilter("paid")}
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  priceFilter === "paid"
                    ? "bg-warning text-primary-foreground shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    : "bg-card border border-border text-muted-foreground hover:bg-card/80 hover:text-foreground"
                }`}
              >
                Trả phí
              </button>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.5)]"
            >
              <ShoppingCart className="w-5 h-5 inline mr-2" />
              Giỏ hàng
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shadow-lg">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8 overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <div className="flex gap-3 pb-2">
            {categoryNames.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-lg whitespace-nowrap transition-all font-medium ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground scale-105 shadow-[0_0_20px_rgba(0,217,255,0.4)]"
                    : "bg-card border border-border text-muted-foreground hover:bg-card/80 hover:text-foreground hover:border-primary/50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Tìm thấy <span className="font-bold text-primary font-mono">{assets.length}</span> assets
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
        <>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              isInCart={cartAssetIds.includes(asset.id)}
              isPurchased={purchasedAssetIds.includes(asset.id)}
              isHighlighted={highlightedAssetId === asset.id}
              onAddToCart={() => addToCart(asset.id)}
              onBuyNow={() => buyNow(asset.id)}
              onViewDetails={() => setSelectedAsset(asset)}
            />
          ))}
        </div>

        {assets.length > 0 && (
          <ClientPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}

        {assets.length === 0 && (
          <div className="text-center py-20">
            <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Không tìm thấy kết quả
            </h3>
            <p className="text-muted-foreground">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
          </div>
        )}
        </>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowCart(false)}
          />

          {/* Sidebar */}
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l border-border z-50 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                  Giỏ hàng
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Cart Items */}
              {cartItems.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground mb-2 font-medium">Giỏ hàng trống</p>
                  <p className="text-sm text-muted-foreground">
                    Thêm assets để tiếp tục
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cartDisplayItems.map((asset) => {
                      const cartRow = cartItems.find((i) => i.assetId === asset.id);

                      return (
                        <div
                          key={asset.id}
                          className="bg-card border border-border rounded-lg p-4 flex gap-4"
                        >
                          <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg overflow-hidden flex-shrink-0">
                            <ImageWithFallback
                              src={
                                asset.thumbnailUrl ||
                                `https://source.unsplash.com/200x200/?${encodeURIComponent(asset.preview)}`
                              }
                              alt={asset.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-sm mb-1 truncate">
                              {asset.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-2">
                              {asset.category}
                            </p>
                            {asset.isFree ? (
                              <p className="text-sm font-bold text-success">Miễn phí</p>
                            ) : (
                              <p className="text-sm font-bold text-foreground font-mono">
                                {asset.price.toLocaleString("vi-VN")} xu
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => cartRow && removeFromCart(cartRow.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <div className="bg-card border border-border rounded-lg p-6 space-y-4 mb-6">
                    <h3 className="font-bold text-foreground mb-4">Tóm tắt đơn hàng</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Số lượng:</span>
                        <span className="font-medium text-foreground">
                          {cartItems.length} assets
                        </span>
                      </div>
                      {freeItemsCount > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Miễn phí:</span>
                          <span className="font-medium text-success">
                            {freeItemsCount} items (0 xu)
                          </span>
                        </div>
                      )}
                      {paidItemsCount > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Trả phí:</span>
                          <span className="font-medium text-foreground font-mono">
                            {paidItemsCount} items
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tổng trừ xu:</span>
                        <span className="font-medium text-foreground font-mono">
                          {totalPrice.toLocaleString("vi-VN")} xu
                        </span>
                      </div>
                      {user && totalPrice > 0 && (
                        <div className="flex justify-between text-muted-foreground text-sm">
                          <span>Số dư hiện tại:</span>
                          <span className="font-mono">{walletBalance.toLocaleString("vi-VN")} xu</span>
                        </div>
                      )}
                      <div className="border-t border-border pt-2 mt-2">
                        <div className="flex justify-between text-xl font-bold text-foreground">
                          <span>Tổng cộng:</span>
                          <span className="text-primary font-mono">
                            {totalPrice.toLocaleString("vi-VN")} xu
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    onClick={handleCheckout}
                    disabled={user != null && totalPrice > 0 && walletBalance < totalPrice}
                  >
                    {totalPrice > 0
                      ? `Thanh toán ${totalPrice.toLocaleString("vi-VN")} xu`
                      : "Thêm vào thư viện"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  {user && totalPrice > 0 && walletBalance < totalPrice && (
                    <p className="text-center text-sm text-destructive mt-4">
                      Thiếu {(totalPrice - walletBalance).toLocaleString("vi-VN")} xu
                    </p>
                  )}

                  {totalPrice === 0 && (
                    <p className="text-center text-sm text-success mt-4 font-medium">
                      Tất cả items trong giỏ đều miễn phí — không trừ xu
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Asset Detail Drawer */}
      <Sheet
        open={!!selectedAsset}
        onOpenChange={(open) => {
          if (!open) setSelectedAsset(null);
        }}
      >
        {selectedAsset && (
          <SheetContent className="p-0 sm:max-w-2xl">
            <AssetDetailDrawerContent
              asset={selectedAsset}
              allAssets={assets}
              isInCart={cartAssetIds.includes(selectedAsset.id)}
              isPurchased={purchasedAssetIds.includes(selectedAsset.id)}
              onSelectAsset={setSelectedAsset}
              onAddToCart={() => {
                addToCart(selectedAsset.id);
                setSelectedAsset(null);
              }}
              onBuyNow={() => {
                buyNow(selectedAsset.id);
                setSelectedAsset(null);
              }}
            />
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}

interface AssetDetailDrawerContentProps {
  asset: Asset;
  allAssets: Asset[];
  isInCart: boolean;
  isPurchased: boolean;
  onSelectAsset: (asset: Asset) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

function AssetDetailDrawerContent({
  asset,
  allAssets,
  isInCart,
  isPurchased,
  onSelectAsset,
  onAddToCart,
  onBuyNow,
}: AssetDetailDrawerContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [asset.id]);

  // Generate mock description
  const description = `${asset.title} là một bộ asset chất lượng cao được thiết kế chuyên nghiệp bởi ${asset.author}. Perfect cho ${asset.category.toLowerCase()} projects. Bao gồm nhiều variations và được tối ưu hóa cho game development.`;

  // Mock features
  const features = [
    "High quality graphics",
    "Multiple variations included",
    "Fully customizable",
    "Optimized for performance",
    "Regular updates",
    "Commercial license included"
  ];

  // Related assets (same category, excluding current)
  const relatedAssets = allAssets
    .filter((a) => a.category === asset.category && a.id !== asset.id)
    .slice(0, 3);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <SheetHeader className="border-b border-border p-6">
        <SheetTitle className="text-2xl font-bold text-foreground">
          {asset.title}
        </SheetTitle>
        <SheetDescription className="text-muted-foreground">
          by {asset.author}
        </SheetDescription>
      </SheetHeader>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preview Image */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
            <ImageWithFallback
              src={`https://source.unsplash.com/800x600/?${encodeURIComponent(asset.preview)}`}
              alt={asset.title}
              className="w-full h-full object-cover"
            />
            {asset.isFree && !isPurchased && (
              <div className="absolute top-4 left-4 bg-success text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                MIỄN PHÍ
              </div>
            )}
            {isPurchased && (
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                <CheckCircle className="w-4 h-4" />
                ĐÃ SỞ HỮU
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <span className="text-2xl font-bold text-foreground">{asset.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground">Rating</p>
            </div>
            <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Download className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-foreground font-mono">{asset.downloads}</span>
              </div>
              <p className="text-sm text-muted-foreground">Downloads</p>
            </div>
            <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
              <div className="mb-2">
                <span className="text-2xl font-bold text-primary font-mono">
                  {asset.isFree ? "Miễn phí" : `${asset.price.toLocaleString("vi-VN")} xu`}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Price</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Mô tả</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full text-sm">
                {asset.category}
              </span>
              {asset.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-card border border-border text-foreground rounded-full text-sm hover:border-primary/50 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Features</h3>
            <ul className="grid md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Related Assets */}
          {relatedAssets.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">Assets tương tự</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {relatedAssets.map((related) => (
                  <div
                    key={related.id}
                    className="bg-card/50 border border-border rounded-xl p-3 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => onSelectAsset(related)}
                  >
                    <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-gradient-to-br from-primary/10 to-secondary/10">
                      <ImageWithFallback
                        src={`https://source.unsplash.com/300x200/?${encodeURIComponent(related.preview)}`}
                        alt={related.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="font-bold text-foreground text-sm mb-1 line-clamp-1">{related.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-warning text-warning" />
                        <span className="text-xs text-foreground">{related.rating}</span>
                      </div>
                      <span className="text-xs font-bold text-primary font-mono">
                        {related.isFree ? 'Miễn phí' : `${related.price.toLocaleString('vi-VN')} xu`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      <div className="border-t border-border p-5">
        <div className="flex items-center gap-3">
          {isPurchased ? (
            <Button variant="outline" className="flex-1" disabled>
              <Library className="w-4 h-4" />
              Đã trong thư viện
            </Button>
          ) : (
            <>
              {!isInCart && (
                <Button variant="outline" className="flex-1" onClick={onAddToCart}>
                  <ShoppingCart className="w-4 h-4" />
                  Thêm giỏ
                </Button>
              )}
              <Button variant="gradient" className="flex-1" onClick={onBuyNow}>
                {asset.isFree ? (
                  <>
                    <Library className="w-4 h-4" />
                    Thêm vào thư viện
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    Mua ngay
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface AssetCardProps {
  asset: Asset;
  isInCart: boolean;
  isPurchased: boolean;
  isHighlighted: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onViewDetails: () => void;
}

function AssetCard({ asset, isInCart, isPurchased, isHighlighted, onAddToCart, onBuyNow, onViewDetails }: AssetCardProps) {
  const priceLabel = asset.isFree
    ? "Miễn phí"
    : `${asset.price.toLocaleString("vi-VN")} xu`;

  const thumbnailSrc =
    asset.thumbnailUrl ||
    `https://source.unsplash.com/400x300/?${encodeURIComponent(asset.preview)}`;

  return (
    <div
      id={`asset-${asset.id}`}
      className={cn(
        "bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden hover:scale-105 transition-all group hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]",
        isHighlighted && "border-primary ring-2 ring-primary/25 shadow-lg shadow-primary/15",
        isPurchased && "border-success/30"
      )}
    >
      <div
        className="relative aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden cursor-pointer"
        onClick={onViewDetails}
      >
        <ImageWithFallback
          src={thumbnailSrc}
          alt={asset.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
            <ExternalLink className="w-4 h-4" />
            Xem chi tiết
          </div>
        </div>
        {asset.isFree && !isPurchased && (
          <div className="absolute top-3 left-3 bg-success text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            Miễn phí
          </div>
        )}
        {isPurchased && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <CheckCircle className="w-3 h-3" />
            ĐÃ SỞ HỮU
          </div>
        )}
        <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-xs flex items-center gap-1 font-mono">
          <Download className="w-3 h-3" />
          {asset.downloads}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            {asset.title}
          </h3>
          <p className="text-sm text-muted-foreground">{asset.category}</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              Đánh giá
            </span>
            <span className="font-medium text-foreground font-mono">{asset.rating}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Tác giả
            </span>
            <span className="font-medium text-foreground truncate max-w-[55%] text-right">
              {asset.author}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShoppingBag className="w-4 h-4" />
              Giá
            </span>
            <span
              className={cn(
                "font-medium font-mono",
                asset.isFree ? "text-success" : "text-foreground"
              )}
            >
              {priceLabel}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          {isPurchased ? (
            <button
              type="button"
              disabled
              className="w-full bg-card border border-border text-muted-foreground py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 cursor-not-allowed opacity-70"
            >
              <Library className="w-4 h-4" />
              Đã trong thư viện
            </button>
          ) : isInCart ? (
            <button
              type="button"
              onClick={onBuyNow}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.4)]"
            >
              {asset.isFree ? (
                <>
                  <Library className="w-4 h-4" />
                  Thêm vào thư viện
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  Mua ngay
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onAddToCart}
                className="flex-1 bg-card hover:bg-card/80 border border-border hover:border-primary/50 text-foreground py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center"
              >
                Giỏ hàng
              </button>
              <button
                type="button"
                onClick={onBuyNow}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.4)]"
              >
                {asset.isFree ? "Thêm thư viện" : "Mua"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
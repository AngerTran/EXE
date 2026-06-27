import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ExternalLink, Globe, Loader2, Package, Download, User } from "lucide-react";
import { fetchCreatorAssets } from "../../api/creators";
import { mapAssetListItem } from "../../api/mappers";
import { BeamPanel } from "./BeamPanel";
import { XuPrice } from "./XuPrice";
import ClientPagination from "./ui/ClientPagination";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { componentClasses } from "../../constants/theme";

export default function CreatorStorefront() {
  const { username = "" } = useParams();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchCreatorAssets>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetchCreatorAssets(username, page, 12);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username, page]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen py-20 text-center px-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Không tìm thấy creator</h1>
        <p className="text-muted-foreground mb-6">@{username} chưa có storefront hoặc chưa active.</p>
        <Link to="/marketplace" className="text-primary hover:underline">
          Về Chợ Assets
        </Link>
      </div>
    );
  }

  const { creator } = data;
  const assets = data.assets.data.map(mapAssetListItem);

  return (
    <div className="min-h-screen py-10">
      <div className={componentClasses.container}>
        <BeamPanel className="bg-white/95 dark:bg-card/70 border border-border rounded-2xl p-8 mb-10" beam={4}>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground font-mono mb-1">@{creator.username}</p>
              <h1 className="text-3xl font-bold text-foreground mb-2">{creator.name}</h1>
              {creator.bio && <p className="text-muted-foreground mb-4 max-w-2xl">{creator.bio}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {creator.stats.approvedCount} asset
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {creator.stats.totalDownloads} download
                </span>
              </div>
              {creator.websiteUrl && (
                <a
                  href={creator.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 text-primary hover:underline text-sm"
                >
                  <Globe className="w-4 h-4" />
                  Portfolio
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </BeamPanel>

        <h2 className="text-xl font-bold text-foreground mb-6">Asset đã duyệt</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <Link key={asset.id} to="/marketplace" state={{ openAssetId: asset.id }}>
              <BeamPanel className="bg-white/95 dark:bg-card/70 border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors h-full" beam={3.5}>
                <div className="aspect-video bg-muted/30 relative">
                  <ImageWithFallback
                    src={asset.thumbnailUrl ?? undefined}
                    alt={asset.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground line-clamp-1">{asset.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{asset.category}</p>
                  <div className="mt-3">
                    {asset.isFree ? (
                      <span className="text-success font-medium">Miễn phí</span>
                    ) : (
                      <XuPrice amount={asset.price} size="sm" />
                    )}
                  </div>
                </div>
              </BeamPanel>
            </Link>
          ))}
        </div>

        {assets.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Chưa có asset công khai</p>
        )}

        {data.assets.total > 12 && (
          <div className="mt-8">
            <ClientPagination page={page} pageSize={12} total={data.assets.total} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

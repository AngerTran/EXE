import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "../../api/client";
import {
  createReview,
  deleteReview,
  fetchAssetReviews,
  updateReview,
  type ReviewItem,
} from "../../api/reviews";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { cn } from "./ui/utils";

interface AssetReviewsPanelProps {
  assetId: string;
  isPurchased: boolean;
  isFree: boolean;
  onRatingUpdated?: (ratingAvg: number, ratingCount: number) => void;
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const iconClass = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              iconClass,
              star <= value ? "fill-warning text-warning" : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function AssetReviewsPanel({
  assetId,
  isPurchased,
  isFree,
  onRatingUpdated,
}: AssetReviewsPanelProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  const ownReview = reviews.find((r) => r.isOwn);
  const canReview = !!user && (isPurchased || isFree) && !ownReview;

  const onRatingUpdatedRef = useRef(onRatingUpdated);
  onRatingUpdatedRef.current = onRatingUpdated;

  const notifyRatingChange = useCallback((items: ReviewItem[]) => {
    const cb = onRatingUpdatedRef.current;
    if (!cb) return;
    const count = items.length;
    const avg = count === 0 ? 0 : items.reduce((s, r) => s + r.rating, 0) / count;
    cb(Math.round(avg * 10) / 10, count);
  }, []);

  const loadReviews = useCallback(
    async (notifyParent = false) => {
      setLoading(true);
      try {
        const data = await fetchAssetReviews(assetId);
        setReviews(data);
        if (notifyParent) notifyRatingChange(data);
      } catch {
        toast.error("Không tải được đánh giá");
        setReviews([]);
      } finally {
        setLoading(false);
      }
    },
    [assetId, notifyRatingChange]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAssetReviews(assetId)
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Không tải được đánh giá");
          setReviews([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  const handleSubmit = async () => {
    if (!user || rating < 1) return;
    setSubmitting(true);
    try {
      await createReview(assetId, rating, comment);
      toast.success("Đã gửi đánh giá");
      setComment("");
      setRating(5);
      await loadReviews(true);
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Không gửi được đánh giá";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (review: ReviewItem) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment ?? "");
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setSubmitting(true);
    try {
      await updateReview(editingId, {
        rating: editRating,
        comment: editComment.trim() || null,
      });
      toast.success("Đã cập nhật đánh giá");
      setEditingId(null);
      await loadReviews(true);
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Không cập nhật được";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      await deleteReview(id);
      toast.success("Đã xóa đánh giá");
      setEditingId(null);
      await loadReviews(true);
    } catch {
      toast.error("Không xóa được đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Đánh giá ({reviews.length})
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl">
          Chưa có đánh giá nào. Hãy là người đầu tiên!
        </p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {reviews.map((review) =>
            editingId === review.id ? (
              <div
                key={review.id}
                className="bg-card/50 border border-primary/30 rounded-xl p-4 space-y-3"
              >
                <StarRating value={editRating} onChange={setEditRating} />
                <Textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Nhận xét của bạn..."
                  rows={3}
                  maxLength={2000}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="gradient" onClick={handleUpdate} disabled={submitting}>
                    Lưu
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={review.id}
                className="bg-card/50 border border-border rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{review.userName}</p>
                    <p className="text-xs text-muted-foreground">{formatReviewDate(review.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} readonly size="sm" />
                    {review.isOwn && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(review)}
                          className="text-muted-foreground hover:text-primary p-1"
                          aria-label="Sửa đánh giá"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(review.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          aria-label="Xóa đánh giá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                )}
              </div>
            )
          )}
        </div>
      )}

      {canReview && (
        <div className="bg-card/50 border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Viết đánh giá của bạn</p>
          <StarRating value={rating} onChange={setRating} />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm với asset này..."
            rows={3}
            maxLength={2000}
          />
          <Button variant="gradient" onClick={handleSubmit} disabled={submitting || rating < 1}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gửi đánh giá"}
          </Button>
        </div>
      )}

      {user && !isPurchased && !isFree && !ownReview && (
        <p className="text-xs text-muted-foreground">
          Mua asset này để có thể đánh giá.
        </p>
      )}

      {!user && (
        <p className="text-xs text-muted-foreground">Đăng nhập để viết đánh giá.</p>
      )}
    </div>
  );
}

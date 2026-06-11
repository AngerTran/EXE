import { useEffect, useState } from "react";
import {
  FileDown,
  Loader2,
  PanelRightClose,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "../../../utils/notify";
import { ApiError } from "../../../api/client";
import {
  generateAiOutline,
  getStoredOutline,
  refineAiOutline,
  setStoredOutline,
} from "../../../api/ai";
import {
  exportOutlineFile,
  OUTLINE_EXPORT_FORMATS,
  sanitizeFilename,
  type OutlineExportFormat,
} from "../../../utils/outlineExport";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AiOutlinePanelProps {
  sessionId: string | null;
  sessionTitle: string;
  hasConversation: boolean;
  credits: number;
  isUnlimited: boolean;
  onCreditsUpdate: (balance: number) => void;
  onRefreshUser: () => void | Promise<void>;
  onCollapse?: () => void;
  showCollapseButton?: boolean;
  className?: string;
}

export function AiOutlinePanel({
  sessionId,
  sessionTitle,
  hasConversation,
  credits,
  isUnlimited,
  onCreditsUpdate,
  onRefreshUser,
  onCollapse,
  showCollapseButton = true,
  className,
}: AiOutlinePanelProps) {
  const [outline, setOutline] = useState("");
  const [refineInput, setRefineInput] = useState("");
  const [exportFormat, setExportFormat] = useState<OutlineExportFormat>("md");
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setOutline("");
      setRefineInput("");
      return;
    }
    setOutline(getStoredOutline(sessionId) ?? "");
    setRefineInput("");
  }, [sessionId]);

  const persistOutline = (content: string) => {
    setOutline(content);
    if (sessionId) setStoredOutline(sessionId, content);
  };

  const handleGenerate = async () => {
    if (!sessionId || !hasConversation) {
      toast.error("Cần có hội thoại trước khi tổng hợp nội dung.");
      return;
    }
    if (!isUnlimited && credits <= 0) {
      toast.error("Bạn đã hết xu! Vui lòng nạp thêm để tiếp tục.");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateAiOutline(sessionId);
      persistOutline(result.content);
      onCreditsUpdate(result.walletBalance);
      await onRefreshUser();
      toast.success("Đã tổng hợp nội dung từ hội thoại.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Tổng hợp nội dung thất bại");
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async () => {
    const instruction = refineInput.trim();
    if (!sessionId || !instruction) return;
    if (!outline.trim()) {
      toast.error("Hãy tổng hợp nội dung trước khi chỉnh sửa.");
      return;
    }
    if (!isUnlimited && credits <= 0) {
      toast.error("Bạn đã hết xu! Vui lòng nạp thêm để tiếp tục.");
      return;
    }

    setRefining(true);
    try {
      const result = await refineAiOutline(sessionId, {
        currentOutline: outline,
        instruction,
      });
      persistOutline(result.content);
      onCreditsUpdate(result.walletBalance);
      await onRefreshUser();
      setRefineInput("");
      toast.success("Đã cập nhật bản tổng hợp theo yêu cầu.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Chỉnh sửa bản tổng hợp thất bại");
    } finally {
      setRefining(false);
    }
  };

  const handleExport = async () => {
    if (!outline.trim()) {
      toast.error("Chưa có nội dung để xuất. Bấm «Tổng hợp nội dung» trước.");
      return;
    }
    const formatMeta = OUTLINE_EXPORT_FORMATS.find((f) => f.value === exportFormat)!;
    const base = sanitizeFilename(sessionTitle || "phiên-chat");

    setExporting(true);
    try {
      await exportOutlineFile(outline, exportFormat, base, sessionTitle);
      toast.success(`Đã tải bản tổng hợp (.${formatMeta.extension})`);
    } catch {
      toast.error("Xuất file thất bại. Thử lại hoặc chọn định dạng khác.");
    } finally {
      setExporting(false);
    }
  };

  const busy = generating || refining || exporting;

  return (
    <aside
      className={cn(
        "ai-glass-sidebar flex flex-col h-full min-h-0 border-l border-border/60",
        className
      )}
    >
      <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border/50">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            Tổng hợp dự án
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            Gom chat thành bản kế hoạch game
          </p>
        </div>
        {showCollapseButton && onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="p-2 rounded-lg text-primary bg-primary/10 border border-primary/25 hover:bg-primary/20 transition-colors shrink-0"
            aria-label="Thu gọn khung tổng hợp"
            title="Thu gọn"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="shrink-0 p-3 border-b border-border/40 space-y-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-9 rounded-lg border-border/80 bg-card/95 text-foreground shadow-sm hover:bg-card dark:bg-card/90 dark:border-primary/35 dark:text-foreground dark:hover:bg-card/80"
          onClick={() => void handleGenerate()}
          disabled={!hasConversation || busy || (!isUnlimited && credits <= 0)}
        >
          {generating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Tổng hợp nội dung
        </Button>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70 dark:text-foreground/80 mb-1.5 px-0.5">
            Xuất file
          </p>
          <div className="flex items-stretch gap-2">
            <Select
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as OutlineExportFormat)}
            >
              <SelectTrigger
                size="sm"
                className="flex-1 min-w-0 h-9 rounded-lg border-border/80 bg-card/95 text-xs text-foreground shadow-sm hover:bg-card dark:bg-card/90 dark:border-primary/35 dark:text-foreground dark:hover:bg-card/80 focus-visible:ring-primary/30"
                aria-label="Định dạng file xuất"
              >
                <SelectValue placeholder="Chọn định dạng" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="z-[200] rounded-lg border-border/80 bg-popover/95 backdrop-blur-md shadow-lg"
              >
                {OUTLINE_EXPORT_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs rounded-md py-2">
                    <span className="flex w-full items-center justify-between gap-4 pr-1">
                      <span className="font-medium">{f.label}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">.{f.extension}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="gradient"
              size="sm"
              className="h-9 shrink-0 gap-1.5 px-3 rounded-lg text-white hover:text-white"
              onClick={() => void handleExport()}
              disabled={!outline.trim() || busy}
              title="Tải bản tổng hợp"
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span className="text-xs font-semibold">Xuất</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-3 gap-3 overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 shrink-0">
            Bản tổng hợp
          </label>
          <textarea
            value={outline}
            onChange={(e) => persistOutline(e.target.value)}
            placeholder={
              hasConversation
                ? "Bấm «Tổng hợp nội dung» — AI gom hội thoại thành kế hoạch: ý tưởng, gameplay, MVP, roadmap, asset, rủi ro…"
                : "Chat với AI trước, sau đó bấm «Tổng hợp nội dung»."
            }
            className="flex-1 min-h-[140px] w-full resize-none rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ai-chat-scroll"
          />
        </div>

        <div className="shrink-0 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Yêu cầu AI chỉnh sửa
          </label>
          <textarea
            value={refineInput}
            onChange={(e) => setRefineInput(e.target.value)}
            rows={2}
            placeholder="VD: mở rộng MVP, thêm rủi ro multiplayer, rút gọn roadmap..."
            disabled={!outline.trim() || busy}
            className="w-full resize-none rounded-xl border border-border bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-lg border-border/80 bg-card/95 text-foreground shadow-sm hover:bg-card dark:bg-card/90 dark:border-primary/35 dark:text-foreground dark:hover:bg-card/80"
            onClick={() => void handleRefine()}
            disabled={!refineInput.trim() || !outline.trim() || busy || (!isUnlimited && credits <= 0)}
          >
            {refining ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            AI chỉnh sửa
          </Button>
          <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
            1 xu / lần tổng hợp hoặc chỉnh sửa. Chat thêm bên trái rồi bấm «Tổng hợp nội dung» lại.
          </p>
        </div>
      </div>
    </aside>
  );
}

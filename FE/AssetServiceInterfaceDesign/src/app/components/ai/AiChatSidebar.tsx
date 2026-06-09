import { useState } from "react";
import { SquarePen, Trash2, Loader2, Eraser } from "lucide-react";
import type { AiSessionListItem } from "../../../api/types/ai";
import { cn } from "../ui/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface AiChatSidebarProps {
  sessions: AiSessionListItem[];
  activeSessionId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onCleanupEmpty?: () => void | Promise<void>;
  className?: string;
}

export function isEmptySession(s: AiSessionListItem) {
  return (s.messageCount ?? 0) === 0;
}

export function AiChatSidebar({
  sessions,
  activeSessionId,
  loading,
  onSelect,
  onNewChat,
  onDelete,
  onCleanupEmpty,
  className,
}: AiChatSidebarProps) {
  const [deleteTarget, setDeleteTarget] = useState<AiSessionListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const emptyCount = sessions.filter(
    (s) => isEmptySession(s) && s.id !== activeSessionId
  ).length;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const confirmCleanup = async () => {
    if (!onCleanupEmpty) return;
    setCleaning(true);
    try {
      await onCleanupEmpty();
      setCleanupOpen(false);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <>
      <aside
        className={cn(
          "ai-glass-sidebar flex flex-col h-full min-h-0",
          className
        )}
      >
        <div className="p-2 shrink-0 space-y-1">
          <button
            type="button"
            onClick={onNewChat}
            className="ai-sidebar-new-chat w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground border hover:bg-primary/10 hover:border-primary/35 transition-all"
          >
            <SquarePen className="w-4 h-4 shrink-0" />
            Đoạn chat mới
          </button>
          {onCleanupEmpty && emptyCount > 0 && (
            <button
              type="button"
              onClick={() => setCleanupOpen(true)}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            >
              <Eraser className="w-3.5 h-3.5" />
              Xóa {emptyCount} trống
            </button>
          )}
        </div>

        <div className="px-3 pt-2 pb-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Gần đây
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 scrollbar-thin scrollbar-thumb-border">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-2">
              Chưa có hội thoại
            </p>
          ) : (
            sessions.map((s) => {
              const active = s.id === activeSessionId;
              const empty = isEmptySession(s);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "group flex items-center rounded-lg transition-colors",
                    active
                      ? "ai-sidebar-active"
                      : "hover:bg-background/30 dark:hover:bg-background/20"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    className="flex-1 text-left px-3 py-2 min-w-0 text-sm truncate text-foreground/90"
                    title={s.title}
                  >
                    {s.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(s)}
                    className="p-2 mr-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                    title={empty ? "Xóa phiên trống" : "Xóa hội thoại"}
                    aria-label={`Xóa ${s.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa hội thoại?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Bạn sắp xóa <strong className="text-foreground">「{deleteTarget.title}」</strong>.
                  Thao tác này không thể hoàn tác.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cleanupOpen} onOpenChange={setCleanupOpen}>
        <AlertDialogContent className="bg-card border-border sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tất cả hội thoại trống?</AlertDialogTitle>
            <AlertDialogDescription>
              Sẽ xóa <strong className="text-foreground">{emptyCount}</strong> phiên không có tin nhắn.
              Phiên đang mở sẽ được giữ lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleaning}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmCleanup();
              }}
              disabled={cleaning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cleaning ? "Đang dọn..." : "Xóa tất cả trống"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

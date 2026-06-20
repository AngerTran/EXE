import { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  ShoppingBag,
  ExternalLink,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "../../utils/notify";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../../api/client";
import {
  createAiSession,
  cleanupEmptyAiSessions,
  deleteAiSession,
  ensureEmptyAiSession,
  fetchAiSession,
  fetchAiSessions,
  sendAiMessage,
  setStoredAiSessionId,
} from "../../api/ai";
import type { AiMessage, AiSessionListItem, AiSuggestedAsset } from "../../api/types/ai";
import { LOGO_ICON_SRC } from "./AppLogo";
import { BeamPanel } from "./BeamPanel";
import { AiChatSidebar } from "./ai/AiChatSidebar";
import { AiChatInput } from "./ai/AiChatInput";
import { AiEmptyState } from "./ai/AiEmptyState";
import { AiMessageBody } from "./ai/AiMessageBody";
import { AiNoAssetsNotice } from "./ai/AiNoAssetsNotice";
import { AiOutlinePanel } from "./ai/AiOutlinePanel";
import { AiTypingIndicator } from "./ai/AiTypingIndicator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestedAssets?: AiSuggestedAsset[];
  assetSuggestionStatus?: AiMessage["assetSuggestionStatus"];
}

function mapApiMessage(m: AiMessage): Message {
  return {
    id: m.id,
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
    timestamp: new Date(m.createdAt),
    suggestedAssets: m.suggestedAssets ?? undefined,
    assetSuggestionStatus: m.assetSuggestionStatus ?? undefined,
  };
}

function sortMessagesChronologically(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => {
    const byTime = a.timestamp.getTime() - b.timestamp.getTime();
    if (byTime !== 0) return byTime;
    if (a.role === b.role) return 0;
    return a.role === "user" ? -1 : 1;
  });
}

export default function Dashboard() {
  const { user, isLoading: authLoading, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AiSessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [input, setInput] = useState("");
  const [credits, setCredits] = useState(user?.credits || 0);
  const isUnlimited = user?.isUnlimited ?? false;
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [outlineSheetOpen, setOutlineSheetOpen] = useState(false);
  const [desktopOutlineOpen, setDesktopOutlineOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    refreshUserData();
  }, []);

  useEffect(() => {
    const handleFocus = () => void refreshUserData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshUserData]);

  useEffect(() => {
    if (user) setCredits(user.credits);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const reloadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const list = await fetchAiSessions();
      setSessions(list);
      return list;
    } catch {
      setSessions([]);
      return [];
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const cleanupEmptySessions = useCallback(
    async (keepId: string | null) => {
      const { deleted } = await cleanupEmptyAiSessions(keepId);
      if (deleted > 0) {
        toast.success(`Đã xóa ${deleted} hội thoại trống`);
      }
      return reloadSessions();
    },
    [reloadSessions]
  );

  const loadSession = useCallback(
    async (id: string) => {
      setSessionLoading(true);
      try {
        const detail = await fetchAiSession(id);
        setSessionId(detail.id);
        setStoredAiSessionId(detail.id);
        if (detail.messages.length === 0) {
          setMessages([]);
        } else {
          setMessages(sortMessagesChronologically(detail.messages.map(mapApiMessage)));
        }
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Không tải được hội thoại");
      } finally {
        setSessionLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const list = await reloadSessions();
      if (cancelled) return;

      const targetId = await ensureEmptyAiSession(list);
      if (cancelled) return;

      await loadSession(targetId);
      if (cancelled) return;
      await reloadSessions();
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, loadSession, reloadSessions]);

  const handleNewChat = async () => {
    try {
      await cleanupEmptyAiSessions(null);
      const created = await createAiSession("Phiên mới");
      await cleanupEmptyAiSessions(created.id);
      setSessionId(created.id);
      setStoredAiSessionId(created.id);
      setMessages([]);
      setSidebarOpen(false);
      await reloadSessions();
      await loadSession(created.id);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không tạo được chat mới");
    }
  };

  const handleSelectSession = async (id: string) => {
    if (id === sessionId) {
      setSidebarOpen(false);
      return;
    }
    await loadSession(id);
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteAiSession(id);
      const list = await reloadSessions();
      if (id === sessionId) {
        const targetId = await ensureEmptyAiSession(list);
        await loadSession(targetId);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Xóa thất bại");
    }
  };

  const handleCleanupEmptySessions = async () => {
    await cleanupEmptySessions(sessionId);
    const refreshed = await reloadSessions();
    if (sessionId && !refreshed.some((s) => s.id === sessionId)) {
      const targetId = await ensureEmptyAiSession(refreshed);
      await loadSession(targetId);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    if (!isUnlimited && credits <= 0) {
      toast.error("Bạn đã hết xu! Vui lòng nạp thêm để tiếp tục.");
      return;
    }

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      try {
        const created = await createAiSession("Phiên chat mới");
        activeSessionId = created.id;
        setSessionId(created.id);
        setStoredAiSessionId(created.id);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Không tạo được phiên chat");
        return;
      }
    }

    const userMessage: Message = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await sendAiMessage(activeSessionId, text);
      const assistantMessage = mapApiMessage(result.assistantMessage);
      setMessages((prev) => [...prev, assistantMessage]);
      setCredits(result.walletBalance);
      await refreshUserData();
      await reloadSessions();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Gửi tin nhắn thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const hasConversation = messages.some((m) => m.role === "user");
  const activeSessionTitle =
    sessions.find((s) => s.id === sessionId)?.title ?? "AssetBox AI";

  const sidebarProps = {
    sessions,
    activeSessionId: sessionId,
    loading: sessionsLoading,
    onSelect: (id: string) => void handleSelectSession(id),
    onNewChat: () => void handleNewChat(),
    onDelete: (id: string) => void handleDeleteSession(id),
    onCleanupEmpty: () => void handleCleanupEmptySessions(),
  };

  const outlinePanelProps = {
    sessionId,
    sessionTitle: activeSessionTitle,
    hasConversation,
    credits,
    isUnlimited,
    onCreditsUpdate: setCredits,
    onRefreshUser: refreshUserData,
  };

  const handlePromptSelect = (text: string) => {
    setInput(text);
  };

  const inputProps = {
    value: input,
    onChange: setInput,
    onSend: () => void handleSend(),
    onKeyDown: handleKeyDown,
    disabled: !isUnlimited && credits <= 0,
    sending: isLoading,
    placeholder:
      isUnlimited || credits > 0
        ? "Mô tả ý tưởng game của bạn..."
        : "Hết xu — vào Gói dịch vụ để nạp thêm",
  };

  const messageList = (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className="w-full ai-msg-enter"
          style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
        >
          {message.role === "user" ? (
            <div className="flex justify-end">
              <div className="ai-glass-user max-w-[85%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          ) : (
            <BeamPanel beam={5} className="ai-glass-panel overflow-hidden">
              <div className="px-4 py-3.5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                  <img src={LOGO_ICON_SRC} alt="" className="w-5 h-5 object-contain" />
                  <span className="text-xs font-medium text-primary tracking-wide">AssetBox AI</span>
                </div>
                <AiMessageBody content={message.content} />
                {message.suggestedAssets && message.suggestedAssets.length > 0 && (
                  <div className="pt-3 border-t border-primary/10 space-y-2.5">
                    <p className="text-xs text-primary/80 flex items-center gap-1.5 font-medium">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Gợi ý từ Chợ AssetBox
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {message.suggestedAssets.map((asset) => (
                        <Link
                          key={asset.assetId}
                          to={`/marketplace?details=${asset.assetId}`}
                          className="ai-glass-asset group flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all"
                        >
                          {asset.thumbnailUrl ? (
                            <img
                              src={asset.thumbnailUrl}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover shrink-0 ring-1 ring-primary/20"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-primary/10 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {asset.title}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {message.assetSuggestionStatus === "not_found" && <AiNoAssetsNotice />}
              </div>
            </BeamPanel>
          )}
        </div>
      ))}
      {isLoading && <AiTypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );

  return (
    <div className="flex h-full w-full min-h-0 overflow-hidden bg-transparent">
      <div
        className={`hidden md:flex shrink-0 self-stretch min-h-0 transition-[width] duration-200 ease-out overflow-hidden ${
          desktopSidebarOpen ? "w-[260px]" : "w-0"
        }`}
      >
        <AiChatSidebar {...sidebarProps} className="w-[260px] h-full min-h-0 border-0 shrink-0" />
      </div>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full bg-transparent">
        <header className="ai-chat-header-glass h-11 shrink-0 flex items-center gap-2 px-3 sm:px-4">
          <button
            type="button"
            className="hidden md:inline-flex p-2 rounded-lg text-primary bg-primary/10 border border-primary/25 hover:bg-primary/20 transition-colors"
            onClick={() => setDesktopSidebarOpen((open) => !open)}
            aria-label={desktopSidebarOpen ? "Thu gọn lịch sử chat" : "Mở lịch sử chat"}
            title={desktopSidebarOpen ? "Thu gọn sidebar" : "Mở sidebar"}
          >
            {desktopSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeft className="w-5 h-5" />
            )}
          </button>
          <button
            type="button"
            className="md:hidden p-2 -ml-1 rounded-lg text-primary bg-primary/10 border border-primary/25 hover:bg-primary/20 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Mở lịch sử chat"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-muted-foreground truncate min-w-0 flex-1">
            {activeSessionTitle}
          </span>
          {hasConversation && (
            <button
              type="button"
              className="hidden md:inline-flex p-2 rounded-lg text-primary bg-primary/10 border border-primary/25 hover:bg-primary/20 transition-colors shrink-0 ml-auto"
              onClick={() => setDesktopOutlineOpen((open) => !open)}
              aria-label={desktopOutlineOpen ? "Thu gọn tổng hợp" : "Mở tổng hợp dự án"}
              title={desktopOutlineOpen ? "Thu gọn tổng hợp" : "Mở tổng hợp dự án"}
            >
              {desktopOutlineOpen ? (
                <PanelRightClose className="w-5 h-5" />
              ) : (
                <PanelRight className="w-5 h-5" />
              )}
            </button>
          )}
          {hasConversation && (
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-primary bg-primary/10 border border-primary/25 hover:bg-primary/20 transition-colors shrink-0 ml-auto"
              onClick={() => setOutlineSheetOpen(true)}
              aria-label="Mở tổng hợp dự án"
            >
              <PanelRight className="w-5 h-5" />
            </button>
          )}
        </header>

        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto ai-chat-scroll">
            {sessionLoading ? (
              <div className="flex justify-center items-center min-h-full">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : !hasConversation ? (
              <div className="min-h-full flex flex-col items-center justify-center px-4 pb-8 pt-6 gap-8">
                <AiEmptyState onPromptSelect={handlePromptSelect} />
                <div className="w-full px-2 ai-msg-enter" style={{ animationDelay: "0.12s" }}>
                  <AiChatInput {...inputProps} showFootnote />
                </div>
              </div>
            ) : (
              messageList
            )}
          </div>

          {hasConversation && (
            <div className="shrink-0 px-4 pb-5 pt-2">
              <AiChatInput {...inputProps} />
            </div>
          )}
        </div>
      </div>

      <div
        className={`hidden md:flex shrink-0 self-stretch min-h-0 transition-[width] duration-200 ease-out overflow-hidden ${
          desktopOutlineOpen && hasConversation ? "w-[min(100%,320px)]" : "w-0"
        }`}
      >
        {hasConversation && (
          <AiOutlinePanel
            {...outlinePanelProps}
            onCollapse={() => setDesktopOutlineOpen(false)}
            className="w-[320px] h-full min-h-0 shrink-0"
          />
        )}
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[min(100vw-2rem,260px)] p-0 border-r ai-glass-sidebar"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Lịch sử chat</SheetTitle>
            <SheetDescription>Danh sách phiên chat AssetBox AI</SheetDescription>
          </SheetHeader>
          <AiChatSidebar {...sidebarProps} className="h-full border-0" />
        </SheetContent>
      </Sheet>

      <Sheet open={outlineSheetOpen} onOpenChange={setOutlineSheetOpen}>
        <SheetContent
          side="right"
          className="w-[min(100vw-2rem,320px)] p-0 border-l ai-glass-sidebar"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Tổng hợp dự án</SheetTitle>
            <SheetDescription>Gom hội thoại AI thành kế hoạch game</SheetDescription>
          </SheetHeader>
          <AiOutlinePanel
            {...outlinePanelProps}
            showCollapseButton={false}
            className="h-full border-0"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

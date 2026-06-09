import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Loader2,
  ShoppingBag,
  ExternalLink,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "../../utils/notify";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../../api/client";
import {
  createAiSession,
  cleanupEmptyAiSessions,
  deleteAiSession,
  fetchAiSession,
  fetchAiSessions,
  getStoredAiSessionId,
  sendAiMessage,
  setStoredAiSessionId,
} from "../../api/ai";
import type { AiMessage, AiSessionListItem, AiSuggestedAsset } from "../../api/types/ai";
import { LOGO_ICON_SRC } from "./AppLogo";
import { BeamPanel } from "./BeamPanel";
import { AiChatSidebar } from "./ai/AiChatSidebar";
import { AiMessageBody } from "./ai/AiMessageBody";
import { AiNoAssetsNotice } from "./ai/AiNoAssetsNotice";
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

const QUICK_PROMPTS = [
  { label: "🏙️ Game Thành Phố", text: "Tôi muốn làm game thành phố" },
  { label: "🎮 RPG 2D", text: "Assets nào cần cho game RPG 2D?" },
  { label: "🏃 Platformer", text: "Gợi ý character sprites cho platformer" },
  { label: "📱 Mobile UI", text: "UI elements cho mobile game" },
] as const;

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      let list = await reloadSessions();
      if (cancelled) return;

      const stored = getStoredAiSessionId();
      const keepId =
        (stored && list.some((s) => s.id === stored) && stored) || list[0]?.id || null;

      await cleanupEmptySessions(keepId);
      list = await reloadSessions();
      if (cancelled) return;

      const pick =
        (stored && list.some((s) => s.id === stored) && stored) || list[0]?.id || null;

      if (pick) {
        await loadSession(pick);
      } else {
        setSessionId(null);
        setStoredAiSessionId(null);
        setMessages([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, loadSession, reloadSessions, cleanupEmptySessions]);

  const handleNewChat = async () => {
    const hasUserMessages = messages.some((m) => m.id !== "welcome");
    if (!hasUserMessages && sessionId) {
      setMessages([]);
      setSidebarOpen(false);
      return;
    }
    try {
      const created = await createAiSession("Phiên chat mới");
      setSessionId(created.id);
      setStoredAiSessionId(created.id);
      setMessages([]);
      setSidebarOpen(false);
      await reloadSessions();
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
        if (list[0]) await loadSession(list[0].id);
        else {
          setSessionId(null);
          setStoredAiSessionId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Xóa thất bại");
    }
  };

  const handleCleanupEmptySessions = async () => {
    await cleanupEmptySessions(sessionId);
    const refreshed = await reloadSessions();
    if (sessionId && !refreshed.some((s) => s.id === sessionId)) {
      if (refreshed[0]) await loadSession(refreshed[0].id);
      else {
        setSessionId(null);
        setStoredAiSessionId(null);
        setMessages([]);
      }
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

  const renderInput = (variant: "empty" | "chat") => (
    <div className="w-full max-w-2xl mx-auto">
      <BeamPanel
        beam={variant === "empty" ? 4.8 : 5.2}
        className="ai-glass-input overflow-hidden"
      >
        <div className="flex items-end gap-2 px-4 py-3 focus-within:ring-1 focus-within:ring-primary/25 rounded-[28px] transition-shadow">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              isUnlimited || credits > 0
                ? "Hỏi bất kỳ điều gì..."
                : "Hết xu — vào Gói dịch vụ để nạp thêm"
            }
            disabled={(!isUnlimited && credits <= 0) || isLoading}
            className="flex-1 min-h-[24px] max-h-32 resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 py-1"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!input.trim() || (!isUnlimited && credits <= 0) || isLoading}
            className="p-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-30 shrink-0 hover:shadow-[0_0_16px_rgba(0,217,255,0.45)] hover:scale-105 active:scale-95 transition-all"
            aria-label="Gửi"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </BeamPanel>
      {variant === "empty" && (
        <>
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.text}
                type="button"
                onClick={() => setInput(q.text)}
                className="ai-glass-chip rounded-full px-3.5 py-1.5 text-sm transition-all"
              >
                {q.label}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground/60 mt-4">
            1 xu / câu hỏi
          </p>
        </>
      )}
    </div>
  );

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
      {isLoading && (
        <div className="ai-glass-typing ai-msg-enter flex items-center gap-3 rounded-2xl px-4 py-3 w-fit">
          <img src={LOGO_ICON_SRC} alt="" className="w-5 h-5 object-contain opacity-90" />
          <div className="flex items-center gap-1.5">
            <span className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <span className="text-sm text-muted-foreground">Đang suy nghĩ...</span>
        </div>
      )}
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
          {hasConversation && (
            <span className="text-sm text-muted-foreground truncate min-w-0">
              {activeSessionTitle}
            </span>
          )}
        </header>

        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto ai-chat-scroll">
            {sessionLoading ? (
              <div className="flex justify-center items-center min-h-full">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : !hasConversation ? (
              <div className="min-h-full flex flex-col items-center justify-center px-4 pb-12">
                <div className="flex flex-col items-center mb-10 ai-msg-enter">
                  <div className="ai-empty-logo w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-5 shadow-[0_0_32px_rgba(0,217,255,0.15)]">
                    <img src={LOGO_ICON_SRC} alt="" className="w-9 h-9 object-contain" />
                  </div>
                  <h2 className="text-2xl sm:text-[30px] font-semibold text-center tracking-tight ai-empty-title">
                    Chúng ta nên bắt đầu từ đâu?
                  </h2>
                  <p className="text-sm text-muted-foreground/80 mt-3 text-center max-w-sm">
                    Mô tả ý tưởng game — AI sẽ tư vấn và gợi ý asset từ Chợ AssetBox
                  </p>
                </div>
                <div className="w-full px-2 ai-msg-enter" style={{ animationDelay: "0.12s" }}>
                  {renderInput("empty")}
                </div>
              </div>
            ) : (
              messageList
            )}
          </div>

          {hasConversation && (
            <div className="shrink-0 px-4 pb-5 pt-2">
              {renderInput("chat")}
            </div>
          )}
        </div>
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
    </div>
  );
}

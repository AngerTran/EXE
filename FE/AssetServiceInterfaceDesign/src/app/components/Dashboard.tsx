import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Coins, AlertCircle, Loader2, Lock, ShoppingBag, ExternalLink, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../../api/client";
import {
  createAiSession,
  deleteAiSession,
  sendAiMessage,
} from "../../api/ai";
import type { AiSuggestedAsset } from "../../api/types/ai";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestedAssets?: AiSuggestedAsset[];
}

export default function Dashboard() {
  const { user, isLoading: authLoading, refreshUserData } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Refresh user data when component mounts to get latest subscription info
  useEffect(() => {
    refreshUserData();
  }, []);

  // Also refresh when window regains focus (user comes back from another tab)
  useEffect(() => {
    const handleFocus = () => {
      refreshUserData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Listen for storage changes (when data is updated in another component)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' || e.key === 'users') {
        refreshUserData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [credits, setCredits] = useState(user?.credits || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const welcomeMessage = (): Message => ({
    id: "welcome",
    role: "assistant",
    content: `Xin chào ${user?.name || "bạn"}! Tôi là AI Assistant của GameAssets. Hãy cho tôi biết ý tưởng game của bạn, tôi sẽ gợi ý những assets phù hợp nhất! 🎮`,
    timestamp: new Date(),
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const session = await createAiSession("GameAssets Chat");
        if (!cancelled) {
          setSessionId(session.id);
          setMessages([welcomeMessage()]);
        }
      } catch {
        if (!cancelled) setMessages([welcomeMessage()]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Update credits when user changes
  useEffect(() => {
    if (user) {
      setCredits(user.credits);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    if (credits <= 0) {
      toast.error("Bạn đã hết xu! Vui lòng nạp thêm để tiếp tục.");
      return;
    }

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      try {
        const session = await createAiSession("GameAssets Chat");
        activeSessionId = session.id;
        setSessionId(session.id);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Không tạo được phiên chat");
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await sendAiMessage(activeSessionId, text);
      const assistantMessage: Message = {
        id: result.assistantMessage.id,
        role: "assistant",
        content: result.assistantMessage.content,
        timestamp: new Date(result.assistantMessage.createdAt),
        suggestedAssets: result.assistantMessage.suggestedAssets ?? undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setCredits(result.walletBalance);
      await refreshUserData();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Gửi tin nhắn thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChatHistory = async () => {
    if (!confirm("Bạn có chắc muốn xóa toàn bộ lịch sử chat?")) return;
    try {
      if (sessionId) await deleteAiSession(sessionId);
      const session = await createAiSession("GameAssets Chat");
      setSessionId(session.id);
      setMessages([welcomeMessage()]);
    } catch {
      setMessages([welcomeMessage()]);
    }
  };

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                AI Assistant
              </h1>
              <p className="text-muted-foreground">Hỏi tôi về assets cho game của bạn</p>
            </div>

            {/* Credits Display */}
            <div className="flex items-center gap-3">
              {messages.length > 1 && (
                <button
                  onClick={clearChatHistory}
                  className="bg-card hover:bg-card/80 border border-border text-foreground px-4 py-3 rounded-lg transition-all flex items-center gap-2 hover:scale-105"
                  title="Xóa lịch sử chat"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">Xóa lịch sử</span>
                </button>
              )}

              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl px-6 py-3 flex items-center gap-3 shadow-lg">
                <Coins className="w-6 h-6 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground font-mono">Xu còn lại</p>
                  <p className="text-2xl font-bold text-foreground font-mono">{credits}</p>
                </div>
              </div>

              {credits < 5 && (
                <Link
                  to="/pricing"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg transition-all whitespace-nowrap hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.5)]"
                >
                  Nạp thêm
                </Link>
              )}
            </div>
          </div>

          {/* Warning */}
          {credits < 5 && (
            <div className="mt-4 bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground font-medium">Xu sắp hết!</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Bạn chỉ còn {credits} xu. Nạp thêm để tiếp tục sử dụng AI Assistant.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-lg">
          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-secondary/20 border-2 border-secondary"
                  }`}
                >
                  {message.role === "user" ? (
                    <span className="text-primary font-bold">U</span>
                  ) : (
                    <Sparkles className="w-5 h-5 text-secondary" />
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`flex-1 ${
                    message.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block rounded-xl px-6 py-4 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary/10 border border-primary/30 text-foreground shadow-[0_0_20px_rgba(0,217,255,0.1)]"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Suggested Assets */}
                  {message.role === "assistant" && message.suggestedAssets && message.suggestedAssets.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-primary text-sm font-medium">
                        <ShoppingBag className="w-4 h-4" />
                        <span>Assets được gợi ý từ Marketplace:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {message.suggestedAssets.map((asset) => (
                            <Link
                              key={asset.assetId}
                              to={`/marketplace?details=${asset.assetId}`}
                              className="bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-lg p-3 transition-all group hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
                            >
                              <div className="flex items-start gap-3">
                                {asset.thumbnailUrl ? (
                                  <img
                                    src={asset.thumbnailUrl}
                                    alt={asset.title}
                                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                                    {asset.title}
                                  </p>
                                  {asset.relevanceScore != null && (
                                    <p className="text-xs text-muted-foreground">
                                      Phù hợp: {Math.round(asset.relevanceScore * 100)}%
                                    </p>
                                  )}
                                </div>
                                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                              </div>
                            </Link>
                        ))}
                      </div>
                      <Link
                        to="/marketplace"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mt-2"
                      >
                        <span>Xem tất cả trong Marketplace</span>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/20 border-2 border-secondary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-secondary" />
                </div>
                <div className="bg-card border border-border rounded-xl px-6 py-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-muted-foreground text-sm">AI đang suy nghĩ...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-card/30">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  credits > 0
                    ? "Nhập câu hỏi của bạn..."
                    : "Hết xu. Vui lòng nạp thêm!"
                }
                disabled={credits <= 0 || isLoading}
                className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || credits <= 0 || isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.5)]"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Mỗi câu hỏi tiêu tốn 1 xu • Còn {credits} xu
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-4 font-medium">Gợi ý câu hỏi nhanh:</p>
          <div className="grid md:grid-cols-4 gap-4">
            <button
              onClick={() => setInput("Tôi muốn làm game thành phố")}
              className="bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-xl p-4 text-left transition-all group hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
            >
              <p className="text-foreground font-medium group-hover:text-primary transition-colors">🏙️ Game Thành Phố</p>
              <p className="text-muted-foreground text-sm mt-1">Assets cần thiết</p>
            </button>

            <button
              onClick={() => setInput("Assets nào cần cho game RPG 2D?")}
              className="bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-xl p-4 text-left transition-all group hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
            >
              <p className="text-foreground font-medium group-hover:text-primary transition-colors">🎮 Game RPG 2D</p>
              <p className="text-muted-foreground text-sm mt-1">Assets cần thiết</p>
            </button>

            <button
              onClick={() => setInput("Gợi ý character sprites cho platformer")}
              className="bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-xl p-4 text-left transition-all group hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
            >
              <p className="text-foreground font-medium group-hover:text-primary transition-colors">🏃 Platformer Game</p>
              <p className="text-muted-foreground text-sm mt-1">Character sprites</p>
            </button>

            <button
              onClick={() => setInput("UI elements cho mobile game")}
              className="bg-card/50 hover:bg-card border border-border hover:border-primary/50 rounded-xl p-4 text-left transition-all group hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
            >
              <p className="text-foreground font-medium group-hover:text-primary transition-colors">📱 Mobile UI</p>
              <p className="text-muted-foreground text-sm mt-1">UI elements</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
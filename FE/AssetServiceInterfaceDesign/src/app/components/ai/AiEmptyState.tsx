import { Sparkles, Brain, Palette, Package } from "lucide-react";
import { LOGO_ICON_SRC } from "../AppLogo";

const PROMPT_SUGGESTIONS = [
  "Platformer 2D pixel art retro, nhân vật nhảy đôi",
  "RPG fantasy turn-based, chiến đấu theo lượt",
  "Puzzle casual mobile, giao diện tối giản",
  "Horror survival, không gian tối hẹp",
] as const;

const MINI_FEATURES = [
  { icon: Brain, label: "Phân tích" },
  { icon: Palette, label: "Art style" },
  { icon: Package, label: "Gợi ý asset" },
] as const;

interface AiEmptyStateProps {
  onPromptSelect: (text: string) => void;
}

export function AiEmptyState({ onPromptSelect }: AiEmptyStateProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2 ai-msg-enter">
      <div className="relative w-[120px] h-[120px] mb-8 flex items-center justify-center">
        <div className="ai-empty-glow absolute inset-0 rounded-full" aria-hidden />
        <div className="ai-empty-ring absolute inset-0 rounded-full" aria-hidden />
        <div className="relative z-10 w-[84px] h-[84px] rounded-full ai-empty-logo flex items-center justify-center border border-primary/35 bg-card/95 shadow-[0_0_32px_rgba(0,217,255,0.2)]">
          <img src={LOGO_ICON_SRC} alt="" className="w-10 h-10 object-contain" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium">
        <Sparkles className="w-3.5 h-3.5" />
        Powered by AI
      </div>

      <h2 className="text-2xl sm:text-[28px] font-bold text-center tracking-tight ai-empty-title mb-3">
        Bắt đầu trò chuyện
      </h2>
      <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-md mb-8">
        Mô tả ý tưởng game — AI phân tích gameplay, art style và gợi ý asset phù hợp từ Chợ AssetBox.
      </p>

      <div className="flex flex-wrap gap-2 justify-center w-full mb-8">
        {PROMPT_SUGGESTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPromptSelect(prompt)}
            className="ai-prompt-chip text-left rounded-full px-3.5 py-2 text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98] max-w-full"
          >
            <span className="text-primary/80 mr-1.5">↖</span>
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        {MINI_FEATURES.map((f, i) => (
          <span key={f.label} className="inline-flex items-center gap-1.5">
            {i > 0 && <span className="w-1 h-1 rounded-full bg-muted-foreground/40 mx-1" />}
            <f.icon className="w-3.5 h-3.5 text-primary" />
            {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}

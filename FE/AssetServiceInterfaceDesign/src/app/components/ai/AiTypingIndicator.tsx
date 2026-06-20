import { Sparkles } from "lucide-react";
import { LOGO_ICON_SRC } from "../AppLogo";

export function AiTypingIndicator() {
  return (
    <div className="ai-glass-typing ai-msg-enter flex items-center gap-3 rounded-2xl px-4 py-3 w-fit max-w-[85%]">
      <img src={LOGO_ICON_SRC} alt="" className="w-5 h-5 object-contain opacity-90 shrink-0" />
      <Sparkles className="w-4 h-4 text-secondary shrink-0" />
      <span className="text-sm text-muted-foreground">AI đang trả lời</span>
      <div className="flex items-center gap-1.5 ml-1">
        <span className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-primary" />
        <span className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-secondary" />
        <span className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-primary" />
      </div>
    </div>
  );
}

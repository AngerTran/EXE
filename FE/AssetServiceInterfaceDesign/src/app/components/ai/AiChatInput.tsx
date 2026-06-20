import { Send, Loader2 } from "lucide-react";
import { BeamPanel } from "../BeamPanel";
import { cn } from "../ui/utils";

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  className?: string;
  showFootnote?: boolean;
}

export function AiChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  disabled = false,
  sending = false,
  placeholder = "Mô tả ý tưởng game của bạn...",
  className,
  showFootnote = false,
}: AiChatInputProps) {
  const canSend = value.trim().length > 0 && !disabled && !sending;

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <BeamPanel beam={5.2} className="ai-glass-input ai-input-shell overflow-hidden">
        <div className="flex items-end gap-2 px-4 py-3 focus-within:ring-2 focus-within:ring-primary/30 rounded-[28px] transition-shadow">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={placeholder}
            disabled={disabled || sending}
            className="flex-1 min-h-[24px] max-h-32 resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 py-1"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className={cn(
              "ai-send-btn p-2.5 rounded-xl shrink-0 transition-all",
              canSend
                ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,217,255,0.45)] hover:scale-105 active:scale-95"
                : "bg-muted/40 text-muted-foreground opacity-50 cursor-not-allowed"
            )}
            aria-label="Gửi"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </BeamPanel>
      {showFootnote && (
        <p className="text-center text-xs ai-footnote mt-4">1 xu / câu hỏi</p>
      )}
    </div>
  );
}

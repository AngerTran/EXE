import type { ReactNode } from "react";

const FALLBACK_NOTE_PATTERN =
  /đang dùng chế độ tư vấn cơ bản|api key ai trên server|cấu hình api key/i;

const LEGACY_PREFIX_PATTERN = /^gợi ý cho:/i;

function isFallbackNote(line: string) {
  return FALLBACK_NOTE_PATTERN.test(line);
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="px-1 py-0.5 rounded bg-muted/30 font-mono text-xs"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function AiMessageBody({ content }: { content: string }) {
  const lines = content.split("\n");
  const bodyLines: string[] = [];
  const noteLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      bodyLines.push(line);
      continue;
    }
    if (isFallbackNote(trimmed)) {
      noteLines.push(trimmed.replace(/^[_*]+|[_*]+$/g, ""));
    } else if (LEGACY_PREFIX_PATTERN.test(trimmed)) {
      const rest = trimmed.replace(LEGACY_PREFIX_PATTERN, "").trim();
      if (rest) bodyLines.push(rest);
    } else {
      bodyLines.push(line);
    }
  }

  return (
    <div className="ai-message-body space-y-2 text-[15px] leading-relaxed text-foreground">
      {bodyLines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <p key={i} className="flex gap-2.5 text-foreground pl-0.5">
              <span className="text-primary shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(0,217,255,0.6)]" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </p>
          );
        }

        if (trimmed.startsWith("_") && trimmed.endsWith("_")) {
          return (
            <p key={i} className="text-sm text-muted-foreground">
              {trimmed.slice(1, -1)}
            </p>
          );
        }

        return (
          <p key={i} className="text-foreground whitespace-pre-wrap">
            {renderInline(line)}
          </p>
        );
      })}
      {noteLines.length > 0 && (
        <p className="ai-footnote text-[10px] pt-2 mt-1 border-t border-border/25 italic">
          {noteLines.map((n) => n.replace(/^[_*]+|[_*]+$/g, "")).join(" ")}
        </p>
      )}
    </div>
  );
}

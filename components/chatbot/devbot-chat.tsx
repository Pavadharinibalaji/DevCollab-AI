"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

// ---------- Tiny markdown renderer (bold, inline-code, code blocks, lists) ----------
function renderMarkdown(text: string): string {
  return text
    // fenced code blocks
    .replace(
      /```(\w*)\n?([\s\S]*?)```/g,
      (_m, lang, code) =>
        `<pre class="devbot-pre"><code class="devbot-code" data-lang="${lang}">${escapeHtml(
          code.trim()
        )}</code></pre>`
    )
    // inline code
    .replace(/`([^`]+)`/g, `<code class="devbot-inline-code">$1</code>`)
    // bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // bullet lists (lines starting with - or *)
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]+?<\/li>)(?:\n|$)/g, "<ul class='devbot-ul'>$1</ul>")
    // numbered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // line breaks
    .replace(/\n/g, "<br />");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------- Bubble ----------
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className={cn(
        "group relative flex gap-2 px-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6e6aed]/20 ring-1 ring-[#6e6aed]/40">
          <Bot className="h-3.5 w-3.5 text-[#6e6aed]" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "relative max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-[#6e6aed] text-white"
            : "rounded-tl-sm bg-[#1c1c21] text-[#ececee] ring-1 ring-[#27272a]"
        )}
      >
        {isUser ? (
          <span>{msg.content}</span>
        ) : (
          <div
            className="devbot-prose"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
          />
        )}

        {/* Copy button (assistant only) */}
        {!isUser && (
          <button
            onClick={copyText}
            className="absolute -right-7 top-1 hidden rounded-md p-1 text-[#8b8b93] hover:bg-[#242429] hover:text-[#ececee] group-hover:flex"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Typing indicator ----------
function TypingDots() {
  return (
    <div className="flex gap-2 px-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6e6aed]/20 ring-1 ring-[#6e6aed]/40">
        <Bot className="h-3.5 w-3.5 text-[#6e6aed]" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-[#1c1c21] px-4 py-3 ring-1 ring-[#27272a]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full bg-[#6e6aed]/70 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- Suggestions ----------
const SUGGESTIONS = [
  "How do I create a new project?",
  "Explain the Kanban board features",
  "How to invite team members?",
  "Help me with a React useEffect bug",
];

// ---------- Main Component ----------
export function DevBotChat({ isAgentOpen }: { isAgentOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [unread, setUnread] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setStreaming(true);

      const assistantId = crypto.randomUUID();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error("API error");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.error) throw new Error(data.error);
              if (data.text) {
                accumulated += data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: accumulated } : m
                  )
                );
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        if (!open) setUnread((n) => n + 1);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "⚠️ Something went wrong. Please check your `ANTHROPIC_API_KEY` in `.env.local` and try again.",
                }
              : m
          )
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming, open]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ---------- Floating trigger button ---------- */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open DevBot"
        className={cn(
          "fixed bottom-5 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-[#6e6aed]/30 transition-all duration-300",
          isAgentOpen ? "right-[calc(18%+1.25rem)]" : "right-5",
          open
            ? "bg-[#242429] ring-1 ring-[#27272a] text-[#ececee] scale-95"
            : "bg-[#6e6aed] text-white hover:bg-[#5b57d6] hover:scale-105"
        )}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <Bot className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </>
        )}
      </button>

      {/* ---------- Chat panel ---------- */}
      {open && (
        <div
          className={cn(
            "fixed bottom-20 z-50 flex flex-col overflow-hidden rounded-2xl border border-[#27272a] bg-[#121214] shadow-2xl shadow-black/50 transition-all duration-300",
            isAgentOpen ? "right-[calc(18%+1.25rem)]" : "right-5",
            expanded
              ? "h-[min(680px,80vh)] w-[min(520px,calc(100vw-2rem))]"
              : "h-[min(560px,75vh)] w-[min(380px,calc(100vw-2rem))]"
          )}
          style={{ animation: "devbot-slide-up 0.2s ease" }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-2.5 border-b border-[#27272a] bg-[#121214] px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6e6aed]/15 ring-1 ring-[#6e6aed]/30">
              <Sparkles className="h-4 w-4 text-[#6e6aed]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#ececee]">DevBot</p>
              <p className="text-[11px] text-[#8b8b93]">
                {streaming ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Thinking…
                  </span>
                ) : (
                  "AI assistant · Always available"
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                title="Clear chat"
                className="rounded-md p-1.5 text-[#8b8b93] hover:bg-[#242429] hover:text-[#ececee] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setExpanded((e) => !e)}
                title={expanded ? "Shrink" : "Expand"}
                className="rounded-md p-1.5 text-[#8b8b93] hover:bg-[#242429] hover:text-[#ececee] transition-colors"
              >
                {expanded ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                className="rounded-md p-1.5 text-[#8b8b93] hover:bg-[#242429] hover:text-[#ececee] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-4 scroll-smooth">
            {isEmpty ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6e6aed]/10 ring-1 ring-[#6e6aed]/20">
                  <Bot className="h-7 w-7 text-[#6e6aed]" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#ececee]">
                    Hey, I&apos;m DevBot 👋
                  </p>
                  <p className="mt-1 text-[12px] text-[#8b8b93] leading-relaxed max-w-[240px]">
                    Ask me anything about DevCollab, coding, or your projects.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="rounded-xl border border-[#27272a] bg-[#1c1c21] px-3 py-2 text-left text-[12px] text-[#ececee] hover:bg-[#242429] hover:border-[#6e6aed]/40 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {streaming && messages[messages.length - 1]?.content === "" && (
                  <TypingDots />
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[#27272a] bg-[#121214] p-3">
            <div className="flex items-end gap-2 rounded-xl border border-[#27272a] bg-[#1c1c21] px-3 py-2 ring-[#6e6aed]/40 focus-within:border-[#6e6aed]/50 focus-within:ring-1 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask DevBot anything…"
                rows={1}
                disabled={streaming}
                className="flex-1 resize-none bg-transparent text-[13px] text-[#ececee] placeholder:text-[#8b8b93] outline-none leading-relaxed max-h-28 disabled:opacity-50"
                style={{ scrollbarWidth: "none" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all",
                  input.trim() && !streaming
                    ? "bg-[#6e6aed] text-white hover:bg-[#5b57d6]"
                    : "bg-[#242429] text-[#8b8b93] cursor-not-allowed"
                )}
              >
                {streaming ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-[#8b8b93]">
              Powered by Claude · Enter to send · Shift+Enter for newline
            </p>
          </div>
        </div>
      )}

      {/* ---------- Inline styles (no Tailwind JIT needed) ---------- */}
      <style>{`
        @keyframes devbot-slide-up {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .devbot-prose { font-size: 13px; line-height: 1.65; }
        .devbot-pre {
          margin: 6px 0;
          padding: 10px 12px;
          border-radius: 8px;
          background: #09090b;
          border: 1px solid #27272a;
          overflow-x: auto;
          font-size: 12px;
        }
        .devbot-code { font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #a78bfa; }
        .devbot-inline-code {
          padding: 1px 5px;
          border-radius: 4px;
          background: #09090b;
          border: 1px solid #27272a;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11.5px;
          color: #a78bfa;
        }
        .devbot-ul { margin: 4px 0; padding-left: 16px; list-style: disc; }
        .devbot-ul li { margin: 2px 0; }
      `}</style>
    </>
  );
}

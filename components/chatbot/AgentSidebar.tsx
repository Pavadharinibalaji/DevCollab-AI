"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  Loader2,
  BookOpen,
  Code,
  Lightbulb,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const QUICK_ACTIONS = [
  {
    icon: Code,
    label: "React Hooks",
    prompt:
      "Can you explain how React hooks work, specifically useState and useEffect, with a quick code example?",
    color: "text-blue-400 border-blue-500/20 bg-blue-500/5",
  },
  {
    icon: BookOpen,
    label: "MongoDB cache",
    prompt:
      "How do I securely connect to MongoDB Atlas in Next.js using Mongoose? Show me a standard connection caching template.",
    color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  },
  {
    icon: Lightbulb,
    label: "DFS vs BFS",
    prompt:
      "I am preparing for coding interviews. Can you explain the difference between Depth First Search (DFS) and Breadth First Search (BFS)?",
    color: "text-purple-400 border-purple-500/20 bg-purple-500/5",
  },
];

export default function AgentSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/check-key", { method: "GET" });
        if (!res.ok) {
          if (!cancelled) setHasKey(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setHasKey(!!data?.hasKey);
          setActiveProvider(data?.activeProvider || "");
        }
      } catch {
        if (!cancelled) setHasKey(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearChat = () => {
    setMessages([]);
    setIsLoading(false);
  };

  const handleQuickAction = (promptText: string) => {
    if (isLoading) return;
    sendMessage(promptText);
  };

  const projectIdFromPath = () => {
    if (!pathname) return "";
    const m = pathname.match(/\/dashboard\/projects\/([^/]+)/);
    return m?.[1] || "";
  };

  const sendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;
    if (hasKey === false) return;

    if (!textToSend) {
      setInput("");
    }

    setIsLoading(true);

    const userMessage: Message = { role: "user", content: messageText };
    const assistantPlaceholder: Message = { role: "assistant", content: "" };

    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, assistantPlaceholder]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          projectId: projectIdFromPath() || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errMsg = errData?.error || "Failed to connect to AI service.";
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content = errMsg;
          }
          return updated;
        });
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const replyText =
        String(data?.reply || "").trim() || "I did not get a response. Please try again.";

      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.content = replyText;
        }
        return updated;
      });
    } catch (error) {
      console.warn("Chat error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.content =
            error instanceof Error
              ? error.message
              : "Sorry, I ran into an error. Please try again.";
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border-neutral-900 text-neutral-100 antialiased selection:bg-purple-600/30 selection:text-white min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-900/80 bg-neutral-950/40 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-neutral-950 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-xs tracking-wide text-neutral-100 truncate">
                Agent
              </span>
              <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
            </div>
            <span className="text-[9px] text-neutral-500 font-medium tracking-wider uppercase block truncate">
              {activeProvider ? `${activeProvider} Agent` : "AI Agent"}
            </span>
          </div>
        </div>

        {messages.length > 0 && hasKey !== false && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            disabled={isLoading}
            className="w-7 h-7 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition-colors shrink-0"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-none min-w-0">
        {hasKey === false ? (
          <div className="flex flex-col items-center justify-center h-full w-full text-center space-y-4 py-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-1.5 px-2">
              <h3 className="font-semibold text-neutral-200 tracking-wide text-xs">
                Add API key to use AI
              </h3>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Save an API key (OpenAI, Groq, Anthropic, Gemini) in settings to enable project-aware assistance.
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/settings")}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-8 px-3 rounded-lg"
            >
              Go to Settings
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full w-full text-center space-y-4 py-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div className="space-y-1.5 px-2">
              <h3 className="font-semibold text-neutral-200 tracking-wide text-xs">
                Collaborative AI Assistant
              </h3>
              <p className="text-[11px] text-neutral-400 leading-normal">
                I can help with your current project context and tasks.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="w-full pt-2 space-y-2 px-1">
              <div className="text-left text-[9px] font-semibold text-neutral-500 uppercase tracking-wider pl-1">
                Suggested Topics
              </div>
              {QUICK_ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action.prompt)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl border text-[11px] transition-all duration-200 flex items-start gap-2 hover:scale-[1.01] hover:border-neutral-700/80 hover:bg-neutral-900/60 active:scale-[0.99] min-w-0",
                      action.color,
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="font-medium text-neutral-300 group-hover:text-white leading-tight truncate">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const isLast = i === messages.length - 1;
              const isEmptyAssistant = !isUser && !msg.content;

              return (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2 max-w-[90%] animate-fade-in-up",
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto",
                  )}
                >
                  {/* Icon Avatar */}
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md shrink-0 flex items-center justify-center border shadow-sm",
                      isUser
                        ? "bg-neutral-900 border-neutral-800 text-purple-400"
                        : "bg-gradient-to-tr from-purple-600 to-indigo-600 border-transparent text-white",
                    )}
                  >
                    {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>

                  {/* Bubble content */}
                  <div className="space-y-1 min-w-0">
                    <div
                      className={cn(
                        "p-2.5 text-xs rounded-xl leading-relaxed whitespace-pre-wrap shadow-sm break-words",
                        isUser
                          ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-tr-none"
                          : "bg-neutral-900/80 border border-neutral-800/80 text-neutral-200 rounded-tl-none",
                      )}
                    >
                      {isEmptyAssistant && isLoading && isLast ? (
                        <div className="flex items-center gap-1.5 text-neutral-400 py-0.5 px-0.5">
                          <Loader2 className="w-3 h-3 animate-spin text-purple-400 shrink-0" />
                          <span className="text-[10px] font-medium tracking-wide">
                            Thinking...
                          </span>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="p-3 border-t border-neutral-900 bg-neutral-950 shrink-0"
      >
        <div className="relative flex items-center bg-neutral-900/60 border border-neutral-800/80 rounded-xl focus-within:ring-2 focus-within:ring-purple-600/40 focus-within:border-purple-500 transition-all duration-200 pl-2.5 pr-1.5 py-1.5 gap-2 min-w-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || hasKey === false || hasKey === null}
            placeholder={
              hasKey === false
                ? "Add your API key in settings…"
                : isLoading
                  ? "Thinking..."
                  : "Type..."
            }
            className="flex-1 min-w-0 bg-transparent text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none disabled:opacity-50"
          />

          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim() || hasKey !== true}
            className={cn(
              "w-7 h-7 rounded-lg shrink-0 transition-all duration-200 flex items-center justify-center",
              input.trim()
                ? "bg-purple-600 text-white hover:bg-purple-500 active:scale-95 shadow-md shadow-purple-900/25"
                : "bg-neutral-800 text-neutral-500 cursor-not-allowed",
            )}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
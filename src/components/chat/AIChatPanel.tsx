"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import ProviderCard from "@/components/ProviderCard";
import Link from "next/link";
import type { Provider } from "@/lib/types";

// ── Types ──

interface MatchResult {
  provider: Provider;
  score: number;
  reasons: string[];
}

interface ChatMessage {
  type: "user" | "ai";
  content: string;
  matches?: MatchResult[];
  alternatives?: string[];
  error?: string;
}

// ── Animated Dots ──

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 text-slate-400" aria-label="AI is thinking">
      <span className="animate-bounce [animation-delay:0ms]">●</span>
      <span className="animate-bounce [animation-delay:150ms]">●</span>
      <span className="animate-bounce [animation-delay:300ms]">●</span>
    </span>
  );
}

// ── Component ──

export default function AIChatPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Auto-resize textarea (max 3 lines) ──
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 24; // matches text-base leading-relaxed
    const maxHeight = lineHeight * 3 + 16; // 3 lines + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [input]);

  // ── Cleanup abort controller on unmount ──
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setLoading(true);

    const userMessage: ChatMessage = { type: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("/api/ai/chat-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body && typeof body.error === "string" ? body.error : null) ??
            `Request failed (${res.status})`
        );
      }

      const data = await res.json();

      if (data.matches && data.matches.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            content: `Found ${data.matches.length} match${
              data.matches.length > 1 ? "es" : ""
            } for "${trimmed}"`,
            matches: data.matches,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            content: "No exact matches found. Try these instead:",
            alternatives: data.alternatives ?? [
              "Sports programs",
              "Arts & Culture classes",
              "Music Lessons",
              "Holiday Programs",
            ],
          },
        ]);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return; // Silently ignore aborted requests
      }

      const message =
        err instanceof Error ? err.message : "Something went wrong. Try again.";

      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: "",
          error: message,
        },
      ]);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setLoading(false);
    }
  }, [input, loading]);

  // ── Retry last query ──
  const retryLast = useCallback(() => {
    // Remove the last errored AI message
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.type === "ai" && last.error) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    setError(null);
    // Re-trigger send with the last user message
    const lastUser = [...messages].reverse().find((m) => m.type === "user");
    if (lastUser) {
      setInput(lastUser.content);
    }
  }, [messages]);

  // ── Clear chat ──
  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setLoading(false);
    setInput("");
  }, []);

  // ── Handle Enter key ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Determine visible messages (last 3 pairs = 6 messages) ──
  const visibleMessages = messages.slice(-6);

  // ── Derive state ──
  const hasMessages = messages.length > 0;
  const hasText = input.trim().length > 0;
  const canSend = hasText && !loading;

  return (
    <section className="mx-auto w-full max-w-2xl">
      {/* ── Heading ── */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Find the perfect activity
        </h2>
        <p className="mt-2 text-base text-slate-500">
          Describe what you&apos;re looking for and our AI will match you with
          the best providers
        </p>
      </div>

      {/* ── Chat Card ── */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* ── Chat History ── */}
        {hasMessages && (
          <div className="max-h-96 overflow-y-auto px-4 py-4 sm:px-6">
            {visibleMessages.map((msg, i) => (
              <div
                key={i}
                className={`mb-4 ${msg.type === "user" ? "flex justify-end" : ""}`}
              >
                {/* ── User bubble ── */}
                {msg.type === "user" && (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ilali-50 px-4 py-2.5">
                    <p className="text-sm text-ilali-800">{msg.content}</p>
                  </div>
                )}

                {/* ── AI response ── */}
                {msg.type === "ai" && (
                  <div className="w-full space-y-3">
                    {/* Error state */}
                    {msg.error ? (
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-red-800">
                            Something went wrong. Try again.
                          </p>
                          <p className="mt-0.5 text-xs text-red-600">
                            {msg.error}
                          </p>
                          <button
                            onClick={retryLast}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Retry
                          </button>
                        </div>
                      </div>
                    ) : msg.matches ? (
                      /* ── Results: provider cards ── */
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600">{msg.content}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {msg.matches.map((match) => (
                            <ProviderCard
                              key={match.provider.id}
                              provider={match.provider}
                              matchScore={match.score}
                              matchReasons={match.reasons}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* ── No results: alternatives ── */
                      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-medium text-amber-800">
                          No exact matches found. Try these instead:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.alternatives?.map((alt) => (
                            <Link
                              key={alt}
                              href={`/browse?category=${encodeURIComponent(
                                alt.toLowerCase().replace(/\s+/g, "-")
                              )}`}
                              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-medium text-amber-700 transition-all hover:border-amber-400 hover:bg-amber-50"
                            >
                              {alt}
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* ── Loading indicator ── */}
            {loading && (
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5">
                  <LoadingDots />
                  <span className="text-sm text-slate-400">Searching...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}

        {/* ── Input area ── */}
        <div className="flex items-end gap-2 border-t border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find an activity for my child..."
              disabled={loading}
              rows={1}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-all disabled:opacity-60"
              style={{ minHeight: "2.75rem" }}
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!canSend}
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
              canSend
                ? "bg-ilali-600 text-white shadow-sm hover:bg-ilali-700 active:scale-95"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* ── Footer: sparkle icon + clear chat ── */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered matching
          </div>
          {hasMessages && (
            <button
              onClick={clearChat}
              className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              Clear chat
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

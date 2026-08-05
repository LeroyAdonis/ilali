"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Send,
  LogIn,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

// ── Types ──

interface ClubChatMessage {
  id: string;
  clubSlug: string;
  senderId: string;
  senderName: string | null;
  content: string;
  createdAt: string; // ISO timestamp from the API
}

interface ClubChatProps {
  clubSlug: string;
  clubName?: string;
}

const POLL_INTERVAL_MS = 5000;
const MAX_CONTENT_LENGTH = 500;

// ── Time-ago helper (updates via a 30s ticker) ──

function timeAgo(iso: string, now: number): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const minutes = Math.floor((now - time) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Component ──

export default function ClubChat({ clubSlug, clubName }: ClubChatProps) {
  const { data: session, isPending: sessionPending } = useSession();
  const signedIn = !!session?.user;

  const [messages, setMessages] = useState<ClubChatMessage[]>([]); // oldest → newest
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSeenRef = useRef<string | null>(null); // newest createdAt seen → after= param
  const readyRef = useRef(false); // initial load done → polls may run
  const pollInFlightRef = useRef(false);
  const stickToBottomRef = useRef(true);

  // ── Initial load (also used by retry) ──
  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clubs/${clubSlug}/messages`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body && typeof body.error === "string" ? body.error : null) ??
            `Request failed (${res.status})`
        );
      }
      const data = (await res.json()) as ClubChatMessage[];
      // API is newest-first → reverse to chronological (newest at bottom)
      const ordered = [...data].reverse();
      setMessages(ordered);
      lastSeenRef.current = ordered[ordered.length - 1]?.createdAt ?? null;
      readyRef.current = true;
      stickToBottomRef.current = true;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Couldn't load messages. Try again."
      );
      readyRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [clubSlug]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // ── Poll for new messages every 5s (incremental via after=) ──
  useEffect(() => {
    const poll = async () => {
      if (!readyRef.current || pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      try {
        const after = lastSeenRef.current;
        const url = after
          ? `/api/clubs/${clubSlug}/messages?after=${encodeURIComponent(after)}`
          : `/api/clubs/${clubSlug}/messages`;
        const res = await fetch(url);
        if (!res.ok) return; // silent — keep last good state
        const fresh = (await res.json()) as ClubChatMessage[]; // newest-first
        const ordered = [...fresh].reverse(); // chronological

        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const additions = ordered.filter((m) => !seen.has(m.id));
          if (additions.length === 0) return prev;
          lastSeenRef.current = additions[additions.length - 1].createdAt;
          return [...prev, ...additions];
        });
      } catch {
        // silent poll failure — keep last good state
      } finally {
        pollInFlightRef.current = false;
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [clubSlug]);

  // ── Relative-time ticker ──
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(tick);
  }, []);

  // ── Auto-scroll to bottom on new messages (respect manual scroll-up) ──
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    stickToBottomRef.current = nearBottom;
  }, []);

  useEffect(() => {
    if (stickToBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length, loading]);

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || sending || !signedIn) return;

    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/clubs/${clubSlug}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (body && typeof body.error === "string" ? body.error : null) ??
            `Request failed (${res.status})`
        );
      }
      const created = body as ClubChatMessage;
      setMessages((prev) =>
        prev.some((m) => m.id === created.id) ? prev : [...prev, created]
      );
      lastSeenRef.current = created.createdAt;
      stickToBottomRef.current = true;
      setInput("");
    } catch (err: unknown) {
      setSendError(
        err instanceof Error ? err.message : "Couldn't send message. Try again."
      );
    } finally {
      setSending(false);
    }
  }, [input, sending, signedIn, clubSlug]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !sending && signedIn;

  // ── Render ──
  return (
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/10 bg-paper-warm/60 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-ilali-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink">
            {clubName ? `${clubName} chat` : "Club chat"}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-faint">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ilali-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ilali-500" />
          </span>
          Live
        </span>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-80 space-y-4 overflow-y-auto px-4 py-4 sm:h-96 sm:px-5"
        role="log"
        aria-live="polite"
        aria-label="Club chat messages"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <RefreshCw
              className="h-5 w-5 animate-spin text-ilali-500"
              aria-label="Loading messages"
            />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-ink-soft">
              Couldn&apos;t load the chat
            </p>
            <p className="mt-1 max-w-xs text-xs text-ink-faint">{error}</p>
            <button
              onClick={loadMessages}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3.5 py-2 text-xs font-medium text-ink-soft transition-colors hover:bg-paper-warm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="h-8 w-8 text-ink-faint" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-ink-soft">
              No messages yet
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {signedIn
                ? "Be the first to start the conversation."
                : "Sign in to start the conversation."}
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = msg.senderId === session?.user?.id;
              return (
                <div key={msg.id} className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isOwn
                        ? "bg-ilali-600 text-white"
                        : "bg-gradient-to-br from-ilali-100 to-sunset-100 text-ilali-700"
                    }`}
                    aria-hidden="true"
                  >
                    {(msg.senderName ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div
                    className={`min-w-0 flex-1 rounded-2xl px-4 py-2.5 ${
                      isOwn ? "bg-ilali-50" : "bg-paper-warm"
                    }`}
                  >
                    <div className="flex items-baseline gap-2">
                      <p className="text-xs font-semibold text-ink">
                        {isOwn ? "You" : (msg.senderName ?? "Club member")}
                      </p>
                      <span className="text-[11px] text-ink-faint">
                        {timeAgo(msg.createdAt, now)}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer / sign-in prompt */}
      <div className="border-t border-ink/10 bg-paper-warm p-3 sm:p-4">
        {sessionPending ? null : !signedIn ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-ink/10 bg-white px-4 py-5 text-center">
            <LogIn className="h-5 w-5 text-ink-faint" aria-hidden="true" />
            <p className="text-sm font-medium text-ink-soft">
              Sign in to join the conversation
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-1.5 rounded-lg bg-ilali-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <>
            {sendError && (
              <p className="mb-2 flex items-start gap-1.5 text-xs text-red-600">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {sendError}
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${clubName ?? "the club"}...`}
                disabled={sending}
                rows={1}
                maxLength={MAX_CONTENT_LENGTH}
                className="max-h-24 w-full resize-none rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink-soft placeholder:text-ink-faint focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-all disabled:opacity-60"
                style={{ minHeight: "2.75rem" }}
                aria-label="Type a message"
              />
              <button
                onClick={sendMessage}
                disabled={!canSend}
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
                  canSend
                    ? "bg-ilali-600 text-white shadow-sm hover:bg-ilali-700 active:scale-95"
                    : "cursor-not-allowed bg-paper-warm text-ink-faint"
                }`}
                aria-label="Send message"
              >
                {sending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

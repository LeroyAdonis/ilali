"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ReviewReplyFormProps {
  reviewId: string;
  existingReply?: {
    id: string;
    content: string;
  } | null;
  onSave: (reply: { id: string; content: string }) => void;
  onCancel: () => void;
}

export default function ReviewReplyForm({
  reviewId,
  existingReply,
  onSave,
  onCancel,
}: ReviewReplyFormProps) {
  const [content, setContent] = useState(existingReply?.content ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditing = !!existingReply;

  // Auto-expand textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Reply cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const url = `/api/provider/reviews/${reviewId}/reply`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save reply");
      }

      onSave(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-ink/10 bg-paper-warm p-4">
      <label
        htmlFor={`reply-${reviewId}`}
        className="mb-2 block text-xs font-semibold text-ink-faint uppercase tracking-wide"
      >
        {isEditing ? "Edit your reply" : "Reply to this review"}
      </label>
      <textarea
        ref={textareaRef}
        id={`reply-${reviewId}`}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setError("");
        }}
        placeholder="Write your reply..."
        rows={2}
        className="w-full resize-none rounded-lg border border-ink/10 bg-white px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
        disabled={isSubmitting}
      />
      {error && (
        <p className="mt-1 text-xs text-orange">{error}</p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="inline-flex items-center rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg
                className="-ml-1 mr-2 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            </>
          ) : isEditing ? (
            "Update reply"
          ) : (
            "Post reply"
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-ink-faint transition-colors hover:text-ink disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

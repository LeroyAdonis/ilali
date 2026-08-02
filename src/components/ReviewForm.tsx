"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface ReviewFormProps {
  providerId?: string;
  venueId?: string;
  onSubmitted: () => void;
}

export default function ReviewForm({ providerId, venueId, onSubmitted }: ReviewFormProps) {
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = { reviewerName, rating, content };
      if (providerId) body.providerId = providerId;
      if (venueId) body.venueId = venueId;

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.errors ? Object.values(json.errors).flat().join(", ") : "Something went wrong");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setReviewerName("");
      setRating(0);
      setContent("");
      onSubmitted();
    } catch {
      setError("Could not submit. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-ilali-200 bg-ilali-50 p-6 text-center">
        <p className="text-sm font-semibold text-ilali-700">✅ Review submitted — thank you!</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-xs text-ilali-500 hover:text-ilali-600 underline"
        >
          Write another review
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <h3 className="text-base font-semibold text-ink">Leave a review</h3>

      {/* Star rating */}
      <div>
        <label className="block text-xs font-medium text-ink-soft mb-1.5">Rating</label>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 transition-colors"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-ink-faint"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-xs text-ink-faint self-center">
              {rating}/5
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="reviewerName" className="block text-xs font-medium text-ink-soft mb-1">
          Your name
        </label>
        <input
          id="reviewerName"
          type="text"
          required
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="e.g. Thandi"
          className="w-full rounded-lg border border-ink/10 px-4 py-2.5 text-sm text-ink-soft placeholder:text-ink-faint focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors min-h-[44px]"
        />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="reviewContent" className="block text-xs font-medium text-ink-soft mb-1">
          Your review <span className="text-ink-faint font-normal">(min 10 characters)</span>
        </label>
        <textarea
          id="reviewContent"
          required
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience with this activity..."
          className="w-full rounded-lg border border-ink/10 px-4 py-2.5 text-sm text-ink-soft placeholder:text-ink-faint focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors min-h-[44px] resize-y"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="rounded-full bg-ilali-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 min-h-[44px]"
      >
        {loading ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}

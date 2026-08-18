"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Star, MessageCircle, Edit3, Trash2 } from "lucide-react";
import ReviewReplyForm from "@/components/provider/ReviewReplyForm";
import { IlaliSpinner } from "@/components/IlaliSpinner";

interface Review {
  id: string;
  rating: number;
  content: string | null;
  userId: string | null;
  userName?: string;
  createdAt: string;
  reply?: {
    id: string;
    content: string;
    updatedAt: string;
  } | null;
}

export default function ProviderReviewsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [deletingReply, setDeletingReply] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!isPending && (!session || (session.user as { role?: string }).role !== "provider")) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/provider/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
      } else {
        setError("Failed to load reviews");
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: fetch-on-mount sets loading synchronously, data arrives async
      fetchReviews();
    }
  }, [session, isPending, fetchReviews]);

  const handleReplySaved = (reviewId: string, reply: { id: string; content: string }) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, reply: { id: reply.id, content: reply.content, updatedAt: new Date().toISOString() } }
          : r
      )
    );
    setReplyingTo(null);
  };

  const handleDeleteReply = async (reviewId: string) => {
    if (!window.confirm("Delete your reply? This cannot be undone.")) return;

    setDeletingReply(reviewId);
    try {
      const res = await fetch(`/api/provider/reviews/${reviewId}/reply`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, reply: null } : r))
        );
      }
    } catch (err) {
      console.error("Failed to delete reply:", err);
    } finally {
      setDeletingReply(null);
    }
  };

  // Star rating helper
  const renderStars = (rating: number) => {
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-gold text-gold" : "text-ink/15"}`}
          />
        ))}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isPending || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex items-center justify-center">
          <IlaliSpinner size="sm" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-sm text-orange">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink">Reviews</h1>
        <p className="mt-1 text-sm text-ink-faint">
          See what parents are saying about your activity.
        </p>
      </div>

      {reviews.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-ink/10 bg-paper-warm p-10 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 text-sm font-medium text-ink-soft">
            No reviews yet
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Reviews appear here once parents share their experience.
          </p>
        </div>
      ) : (
        /* Reviews list */
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
            >
              {/* Review header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {renderStars(review.rating)}
                  <span className="text-sm font-medium text-ink">
                    {review.userName ?? "Parent"}
                  </span>
                </div>
                <time className="text-xs text-ink-faint" dateTime={review.createdAt}>
                  {formatDate(review.createdAt)}
                </time>
              </div>

              {/* Review content */}
              {review.content && (
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {review.content}
                </p>
              )}

              {/* Provider reply */}
              {review.reply && replyingTo !== review.id && (
                <div className="mt-3 ml-6 border-l-2 border-ilali-200 pl-4">
                  <p className="text-xs font-semibold text-ilali-600 uppercase tracking-wide">
                    Your reply
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{review.reply.content}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-ink-faint transition-colors hover:text-ink"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReply(review.id)}
                      disabled={deletingReply === review.id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-ink-faint transition-colors hover:text-orange"
                    >
                      <Trash2 className="h-3 w-3" />
                      {deletingReply === review.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}

              {/* Reply form */}
              {replyingTo === review.id && (
                <ReviewReplyForm
                  reviewId={review.id}
                  existingReply={review.reply}
                  onSave={(reply) => handleReplySaved(review.id, reply)}
                  onCancel={() => setReplyingTo(null)}
                />
              )}

              {/* Reply button (no existing reply) */}
              {!review.reply && replyingTo !== review.id && (
                <button
                  onClick={() => setReplyingTo(review.id)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink-faint transition-colors hover:border-teal hover:text-teal"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Reply
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

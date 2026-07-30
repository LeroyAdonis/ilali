import { Star } from "lucide-react";

interface Review {
  id: string;
  userId: string | null;
  rating: number;
  content: string | null;
  createdAt: Date | string;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

interface ReviewListProps {
  reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">No reviews yet. Be the first to share your experience!</p>
      </div>
    );
  }

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <span className="text-2xl font-extrabold text-slate-900">
          {avgRating.toFixed(1)}
        </span>
        <Stars rating={Math.round(avgRating)} />
        <span className="text-xs text-slate-400">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Individual reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {review.userId || "Anonymous"}
                </span>
                <Stars rating={review.rating} />
              </div>
              <span className="text-xs text-slate-400">
                {formatDate(review.createdAt)}
              </span>
            </div>
            {review.content && (
              <p className="text-sm leading-relaxed text-slate-600">
                {review.content}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

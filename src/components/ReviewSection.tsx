"use client";

import { useState, useEffect } from "react";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";

interface ReviewSectionProps {
  providerId?: string;
  venueId?: string;
}

export default function ReviewSection({ providerId, venueId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const targetParam = venueId
    ? `venueId=${venueId}`
    : `providerId=${providerId}`;

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/reviews?${targetParam}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch {
      // Silently fail — reviews are non-critical
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetParam]);

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-3">Reviews</h2>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-ilali-500 border-t-transparent" />
        </div>
      ) : (
        <ReviewList reviews={reviews as Array<{ id: string; userId: string | null; rating: number; content: string | null; createdAt: Date | string }>} />
      )}

      <div className="mt-6">
        <ReviewForm
          providerId={providerId}
          venueId={venueId}
          onSubmitted={fetchReviews}
        />
      </div>
    </div>
  );
}

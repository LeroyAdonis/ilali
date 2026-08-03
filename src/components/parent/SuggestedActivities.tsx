import Link from "next/link";
import {
  suggestActivities,
  type ChildProfileInput,
  type ProviderInput,
  type ScoredProvider,
} from "@/lib/scoring/suggest-activities";

// ── Types ──
interface ChildProfileWithName extends ChildProfileInput {
  name: string;
}

// ── Props ──
interface SuggestedActivitiesProps {
  children: ChildProfileWithName[];
  providers: ProviderInput[];
  scheduledProviderIds: string[];
}

/**
 * SuggestedActivities — scored activity suggestions for each child.
 *
 * Each suggestion card has a visually distinct dotted border + amber tint
 * to clearly differentiate from scheduled events. Deduped against
 * scheduledProviderIds automatically by the scoring engine.
 * Max 5 per child. Renders nothing if no suggestions exist.
 */
export default async function SuggestedActivities({
  children,
  providers,
  scheduledProviderIds,
}: SuggestedActivitiesProps) {
  const results = suggestActivities(children, providers, scheduledProviderIds);

  // Flatten: collect all suggestions across children
  const allSuggestions: {
    childId: string;
    childName: string;
    scored: ScoredProvider;
  }[] = [];

  for (const child of children) {
    const suggestions = results.get(child.id) ?? [];
    for (const scored of suggestions) {
      allSuggestions.push({
        childId: child.id,
        childName: child.name || `Child`,
        scored,
      });
    }
  }

  // If no suggestions at all, render nothing (empty state per spec)
  if (allSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      {allSuggestions.map(({ childId, childName, scored }) => {
        const matchPct = Math.round(scored.score);

        return (
          <div
            key={`${childId}-${scored.providerId}`}
            className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                {/* "Suggested for" tag */}
                <div className="mb-1.5">
                  <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Suggested for {childName}
                  </span>
                </div>

                {/* Provider name */}
                <h3 className="font-display text-sm font-bold text-ink">
                  {scored.providerName}
                </h3>

                {/* Matched interests */}
                {scored.matchedInterests.length > 0 && (
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {scored.matchedInterests.join(" · ")}
                  </p>
                )}
              </div>

              {/* Score badge + link */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  {matchPct}% match
                </span>
                <Link
                  href={`/activity/${scored.providerId}`}
                  className="text-xs font-semibold text-teal hover:text-teal-deep transition-colors whitespace-nowrap"
                >
                  View activity →
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

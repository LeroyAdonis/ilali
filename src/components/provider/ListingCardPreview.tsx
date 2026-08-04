"use client";

import ProviderCard from "@/components/ProviderCard";
import type { Provider } from "@/lib/types";

interface ListingCardPreviewProps {
  provider: Provider;
}

export default function ListingCardPreview({
  provider,
}: ListingCardPreviewProps) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-ink-faint">
        This is how parents see your listing
      </p>
      <div className="max-w-sm">
        <ProviderCard provider={provider} />
      </div>
    </div>
  );
}

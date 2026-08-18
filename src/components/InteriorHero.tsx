import type { ImageEntry } from "@/lib/images";
import ResponsiveImage from "@/components/ResponsiveImage";
import type { ReactNode } from "react";

interface InteriorHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  /** Curated image from the registry (HERO_IMAGES.<key>). */
  image: ImageEntry;
  /** Optional trust badge (e.g. VerificationBadge) rendered under the title. */
  badge?: ReactNode;
}

export default function InteriorHero({
  eyebrow,
  title,
  subtitle,
  image,
  badge,
}: InteriorHeroProps) {
  return (
    <header className="relative overflow-hidden min-h-[32vh] sm:h-[400px] flex items-center border-b border-ink/10">
      {/* Background image — art-directed per breakpoint */}
      <div className="absolute inset-0 z-0">
        <ResponsiveImage
          image={image}
          variant="hero"
          priority
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Warm gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(90deg, rgba(251,248,242,0.96) 0%, rgba(251,248,242,0.82) 35%, rgba(251,248,242,0.25) 60%, rgba(251,248,242,0.03) 100%),
            linear-gradient(0deg, rgba(251,248,242,0.55) 0%, transparent 40%)`,
        }}
      />

      {/* Text content */}
      <div className="relative z-[2] mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-left [text-shadow:0_1px_3px_rgba(0,0,0,0.12)]">
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-[10px] pb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
          <span className="text-gold text-[14px]">★</span> {eyebrow} · Cape Town
          <span className="inline-block w-10 h-px bg-teal/40" />
        </span>

        {/* Title */}
        <h1 className="font-display font-extrabold leading-[1.05] tracking-[-0.02em] text-ink max-w-[14ch] text-[clamp(1.6rem,6vw,3.5rem)] sm:text-[clamp(2.2rem,5vw,3.5rem)] sm:line-clamp-3">
          {title}
        </h1>

        {/* Optional trust badge */}
        {badge ? <div className="mt-4">{badge}</div> : null}

        {/* Subtitle */}
        <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-ink-soft sm:line-clamp-3">
          {subtitle}
        </p>
      </div>
    </header>
  );
}

import Image from "next/image";
import type { ReactNode } from "react";

interface InteriorHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
}

export default function InteriorHero({
  eyebrow,
  title,
  subtitle,
  imageSrc,
  imageAlt,
}: InteriorHeroProps) {
  return (
    <header className="relative overflow-hidden min-h-[32vh] sm:min-h-[42vh] flex items-center border-b border-ink/10">
      {/* Background image */}
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        className="object-cover object-center z-0"
        sizes="100vw"
      />

      {/* Warm gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(90deg, rgba(251,248,242,0.96) 0%, rgba(251,248,242,0.82) 35%, rgba(251,248,242,0.25) 60%, rgba(251,248,242,0.03) 100%),
            linear-gradient(0deg, rgba(251,248,242,0.55) 0%, transparent 40%)`,
        }}
      />

      {/* Text content */}
      <div className="relative z-[2] mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-left">
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-[10px] pb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
          <span className="text-gold text-[14px]">★</span> {eyebrow} · Cape Town
          <span className="inline-block w-10 h-px bg-teal/40" />
        </span>

        {/* Title */}
        <h1 className="font-display font-extrabold leading-[1.05] tracking-[-0.02em] text-ink max-w-[14ch] text-[clamp(1.6rem,6vw,3.5rem)] sm:text-[clamp(2.2rem,5vw,3.5rem)]">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-ink-soft">
          {subtitle}
        </p>

        {/* VETTED Stamp — desktop (hidden below sm) */}
        <div className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 z-[3] hidden sm:flex w-[110px] h-[110px] flex-col items-center justify-center rounded-full border-2 border-gold bg-[rgba(255,253,253,0.88)] shadow-[0_10px_36px_rgba(16,49,46,0.16)] backdrop-blur-sm rotate-[-6deg]">
          <div className="absolute inset-[5px] rounded-full border border-dashed border-teal/50" />
          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-teal-deep-2">
            Vetted
          </span>
          <span className="font-display text-[20px] font-extrabold text-gold-deep leading-[1.1]">
            ★ ✓
          </span>
          <span className="text-[8px] text-purple-deep">every provider</span>
        </div>

        {/* VETTED Stamp — mobile (visible only below sm) */}
        <div className="absolute right-2 sm:right-12 top-1/2 -translate-y-1/2 z-[3] flex sm:hidden w-[84px] h-[84px] flex-col items-center justify-center rounded-full border-2 border-gold bg-[rgba(255,253,253,0.88)] shadow-[0_10px_36px_rgba(16,49,46,0.16)] backdrop-blur-sm rotate-[-6deg]">
          <div className="absolute inset-[4px] rounded-full border border-dashed border-teal/50" />
          <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-teal-deep-2">
            Vetted
          </span>
          <span className="font-display text-[16px] font-extrabold text-gold-deep leading-[1.1]">
            ★ ✓
          </span>
          <span className="text-[7px] text-purple-deep">every provider</span>
        </div>
      </div>
    </header>
  );
}

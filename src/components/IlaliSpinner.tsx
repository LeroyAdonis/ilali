/**
 * IlaliSpinner — 3-dots loader restyled with the ILALI design system.
 *
 * Adapted from 21st.dev/@theutkarshmail/components/3-dots-loader ("a process
 * coming together"): three dots merge at the centre, fly apart into a
 * triangle, spin as one, then merge back — a natural fit for ILALI's
 * parent + provider + kid community.
 *
 * Brand tokens only (globals.css @theme): teal-deep + gold + purple dots
 * (paper + gold + teal on the inverse variant). Animation lives in
 * globals.css under the "Animations" section.
 *
 * API is unchanged from the previous logo-orbit version — all call sites
 * (sign-in/out, admin actions, poster import, chat, community…) work as-is.
 *
 * Usage:
 *   <IlaliSpinner label="Approving…" />
 *   <IlaliSpinner size="lg" variant="inverse" label="Loading your activities" />
 */

import { useId, type CSSProperties } from "react";

type SpinnerSize = "xs" | "sm" | "md" | "lg";
type SpinnerVariant = "default" | "inverse";

const SIZE_MAP: Record<SpinnerSize, number> = {
  xs: 24,
  sm: 40,
  md: 56,
  lg: 80,
};

export function IlaliSpinner({
  size = "md",
  variant = "default",
  label,
  className,
  style,
}: {
  /** Tile width/height in px. Default md (56px). xs (24) is for inline/buttons. */
  size?: SpinnerSize;
  /** default = brand dots (light backgrounds). inverse = light dots (dark/teal). */
  variant?: SpinnerVariant;
  /** Optional status text rendered under the mark. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const px = SIZE_MAP[size];
  // Unique goo-filter id per instance (valid HTML, SSR-safe).
  const filterId = `ilali-goo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // stdDeviation scales with the mark (10 @ 200px → 0.05×size).
  const stdDeviation = Math.max(1.5, px * 0.06);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`ilali-spinner ilali-spinner--${variant} ilali-spinner--${size}${className ? ` ${className}` : ""}`}
      style={{ "--sp-size": `${px}px`, ...style } as CSSProperties}
    >
      <div
        className="ilali-spinner__dots"
        style={{ filter: `url(#${filterId})` }}
      >
        <div className="ilali-spinner__dot ilali-spinner__dot--1" />
        <div className="ilali-spinner__dot ilali-spinner__dot--2" />
        <div className="ilali-spinner__dot ilali-spinner__dot--3" />
      </div>
      {/* Gooey filter definition (referenced by the dots container above). */}
      <svg className="ilali-spinner__goo" aria-hidden="true">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur
              result="blur"
              stdDeviation={stdDeviation}
              in="SourceGraphic"
            />
            <feColorMatrix
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7"
              mode="matrix"
              in="blur"
            />
          </filter>
        </defs>
      </svg>
      {label ? (
        <p className="ilali-spinner__label">{label}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

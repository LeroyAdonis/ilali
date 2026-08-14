/**
 * IlaliSpinner — the ILALI mark as a loading indicator.
 *
 * Concept: "the dot goes out to fetch." The dot of the "i" detaches and
 * orbits the top of the letter, passing through its home position once per
 * revolution — the logo completes itself each cycle, then keeps searching.
 * The smile arc and gold star stay anchored; no added chrome.
 *
 * Uses brand tokens only (globals.css @theme): tile = --color-teal-deep,
 * white = --color-paper, star = --color-warm-400, smile = 40% paper.
 * Animation lives in globals.css under the "Animations" section
 * (.ilali-spinner__orbit + reduced-motion override).
 *
 * Usage:
 *   <IlaliSpinner label="Approving…" />
 *   <IlaliSpinner size="lg" variant="inverse" label="Loading your activities" />
 */

import type { CSSProperties } from "react";

type SpinnerSize = "sm" | "md" | "lg";
type SpinnerVariant = "default" | "inverse";

const SIZE_MAP: Record<SpinnerSize, number> = {
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
  /** Tile width/height in px. Default md (56px). */
  size?: SpinnerSize;
  /** default = teal tile (light backgrounds). inverse = paper tile (dark/teal). */
  variant?: SpinnerVariant;
  /** Optional status text rendered under the mark. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const px = SIZE_MAP[size];
  return (
    <div
      role="status"
      aria-live="polite"
      className={`ilali-spinner ilali-spinner--${variant} ilali-spinner--${size}${className ? ` ${className}` : ""}`}
      style={style}
    >
      <svg
        className="ilali-spinner__mark"
        viewBox="0 0 48 48"
        width={px}
        height={px}
        fill="none"
        aria-hidden="true"
      >
        {/* Rounded square tile */}
        <rect x="1" y="1" width="46" height="46" rx="10" fill="var(--sp-tile)" />
        {/* Stylised "i" body */}
        <rect x="21" y="14" width="6" height="24" rx="3" fill="var(--sp-fg)" />
        {/* Dot of the "i" — orbits the top of the letter (orbit center 24,17, r=7) */}
        <g className="ilali-spinner__orbit">
          <circle className="ilali-spinner__dot" cx="24" cy="10" r="4" fill="var(--sp-fg)" />
        </g>
        {/* Smile / community arc — static anchor */}
        <path
          d="M14 30c4 6 16 6 20 0"
          stroke="var(--sp-smile)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tiny gold star accent — static */}
        <circle cx="36" cy="8" r="3" fill="var(--sp-star)" />
      </svg>
      {label ? (
        <p className="ilali-spinner__label">{label}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

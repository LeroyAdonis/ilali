# ILALI Backlog

Backlog of out-of-scope / proposed items. Each item has a status: `proposed` (valid, no urgency), `scheduled` (queued for a release), or `parked` (set aside with reason).

---

## Item: Restyle interior pages to logo-true palette

**Status:** proposed

The 2026-08-02 design restyle (commit `a84ee00`) covered the **landing page** (`src/app/page.tsx`), the shared **Header/Footer**, and added the new tokens to `globals.css`. Interior pages (`/browse`, `/home`, `/clubs/*`, `/map`, `/admin/*`, etc.) still use the legacy `ilali-*`/`sunset-*`/`warm-*` tokens and the old slate-based components (`CTASection.tsx`, `ProviderCard.tsx`, `Hero.tsx`, `StatsBar.tsx`, `FilterBar.tsx`).

**Trigger to revisit:** Next time Leroy says "restyle the interior" or "make the app match the landing page", or when the next marketing push needs visual consistency.

**Scope estimate:** swap tokens in shared components + key pages; keep all logic/links intact. Same design-only pipeline (tsc + lint delta 0 + build).

---

## Item: Accessibility contrast pass on new palette

**Status:** proposed

Vision QA flagged secondary text contrast (`--ink-soft`) on the new off-white background — we darkened `#4A625F` → `#2F4A46` at release time. A full WCAG AA contrast audit of the new tokens (gold CTA text `#3A2402` on gold, `--ink-soft` on `--paper`, purple badges) is still open.

**Trigger to revisit:** Before any wider roll-out of the palette to interior pages, or if a user reports readability issues.

---

## Item: Micro-interactions / motion on landing

**Status:** proposed

Landing page is static (no animations). Vision QA suggested scroll-reveals / hover micro-interactions would lift it further. KitFix precedent: GSAP load animation on the hero.

**Trigger to revisit:** When the landing page is next touched, or Leroy asks for "more life" on the page.

---

## Review Log

| Date | Reviewer | Result |
|------|----------|--------|
| 2026-08-02 | Ricky | Created backlog after design-restyle release `v20260802-design-restyle`. All 3 items proposed. |

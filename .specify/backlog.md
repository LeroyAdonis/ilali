# ILALI Backlog

Backlog of out-of-scope / proposed items. Each item has a status: `proposed` (valid, no urgency), `scheduled` (queued for a release), or `parked` (set aside with reason).

---

## Item: Interior pages read as "the same" — need DRAMATIC redesign, not token swap (Leroy's feedback 2026-08-02)

**Status:** proposed — HIGH PRIORITY next session

**Leroy's words:** "I see the hero and other changes to the landing page. The inner pages still look the same. With KitFix the change was chalk and cheese."

**Root cause (confirmed):** The interior restyle (commit `1f94539`) was a **class swap** — slate-* → ink/paper, Inter → Bricolage, gradients → solid. But the PAGE STRUCTURE stayed identical, so it reads as the same page with slightly warmer colors. KitFix's win was **structural**: full-bleed photo hero replacing line-art (brighten + object-position + 60vh). Recapping ≠ redesign.

**What dramatic interior redesign means (mirror the landing's signatures):**
1. **Photo-backed page headers** — every top-level section header (/browse, /categories, /home, /clubs, /venues, /map, auth pages) gets a full-bleed FLUX-generated photo banner like the landing hero (kids activities: football, art, swimming, music — golden hour, Cape Town). Currently they're plain `bg-teal-deep` bands.
2. **Signature elements carried into interior** — VETTED stamp motif, color-wheel accents (teal/gold/purple/orange woven through cards), mono eyebrows, term-planner visual on relevant pages.
3. **Card redesign** — ProviderCard/CategoryCard/VenueCard get accent bars, larger imagery, bolder type (not just token colors).
4. **Bigger Bricolage presence** — display sizes scaled up; landing-headline treatment repeated on interior h1s.
5. **Consistent section rhythm** — alternating paper/paper-warm like the landing.

**Approach:** mockup-first (like the landing): build 1-2 interior page mockups in `/tmp/ilali-mockup/`, vision-QA (NVIDIA 90b), get approval, then implement. Consider delegating page batches to subagents again but with STRUCTURAL instructions (add photo headers, redesign cards) not just class swaps.

**Trigger to revisit:** next session — this is the main pending work. KitFix is a proven reference (its hero work is in kitfix-design-system skill).

---

## Item: Restyle interior pages to logo-true palette

**Status: DONE (2026-08-02, commit `1f94539`, tag `v20260802-interior-restyle`)**

All 51 interior pages + 27 shared components restyled via 3-agent fan-out:
slate-* → ink/paper tokens, Bricolage display headings, gradients → solid
`bg-teal-deep`. tsc clean, build passes, E2E 15 pass / 6 pre-existing fails
(0 new). Landing + Header/Footer were done earlier (commit `a84ee00`).

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

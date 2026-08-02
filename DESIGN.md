# Design Language: ILALI

Children's extramural activities marketplace for Cape Town, SA. Light, warm, family-first — built from the official logo's color wheel (off-white bg + teal/gold top, purple/orange bottom).

## Colors

- Surface (paper): #FFFFFD (logo off-white)
- Surface secondary (paper-warm): #FBF8F2 (alt sections, footer)
- Surface card: #FFFFFF (pure white cards)
- Content (ink): #10312E (deep teal-ink, headings)
- Content secondary (ink-soft): #2F4A46 (body text — 7:1 on paper)
- Content tertiary (ink-faint): #5C6B68 (labels, copyright — solid, no opacity)
- Accent teal: #25AFAF (logo teal — links, hero accents)
- Accent teal-deep: #0D9488 (buttons, ilali-600)
- Accent gold: #F6A629 (logo gold — CTAs, star)
- Accent gold-deep: #E08F10 (gold text on light)
- Accent purple: #81548D (logo purple — secondary accents)
- Accent orange: #ED682F (logo orange — rare accent)
- Small-text AA shades: teal-deep-2 #0B6E66, purple-deep #5C3A66, gold-deep-2 #A86A05 (10px mono tags — ≥4.5:1)
- Borders: ink at 10% (rgba(16,49,46,0.10)), strong at 16%

## Typography

- Display: Bricolage Grotesque (via @fontsource/bricolage-grotesque, weights 400/600/700/800)
- Sans: Inter (via @fontsource/inter, 400-800)
- Mono: Space Mono (via @fontsource/space-mono, 400/700) — eyebrows, labels, times, badges
- Scale: xs(12), sm(13), base(16), lg(17), xl(21), 2xl(24), 3xl(30), 4xl(36), display clamp(2.4rem→5.5rem)
- Headings: extrabold (800), tight leading (1.05-1.2)
- Body: normal (400), relaxed leading (1.65-1.7)
- Eyebrows: mono 11px uppercase tracking 0.18em — cap 2 per page

## Spacing

- Scale: Tailwind default (0.25rem increments)
- Cards: p-8, gap-5 (grid)
- Sections: py-24 sm:py-28
- Touch targets: ≥ 44px (min-height on .btn, button, nav a, footer a)
- Focus: 2px solid teal ring, 2px offset, :focus-visible only

## Shapes

- Radius: 10px buttons, 16px cards, 20px provider panel, 999px badges
- Borders: 1px solid ink/10 (subtle)
- Shadows: gold CTA 0 4px 0 rgba(224,143,16,0.28); hover 0 16px 40px rgba(16,49,46,0.08)

## Signature Elements

1. **VETTED stamp** — circular gold-ring stamp, dashed teal inner ring, "★ ✓ every provider". Desktop: right 7% bottom 16%, 124px. Mobile: right 14px top 84px, 84px.
2. **Term planner card** — "How it works" week view (MON/TUE/THU/SAT rows, times, prices, color-coded badges). aria-hidden decorative.
3. **Color-wheel accents** — teal/purple/gold deliberately woven through feature icons, step numbers, planner badges (all four logo colors, never collapsed to one).

## Hero Rules

- Full-bleed photo (`/images/hero/hero-kids.jpg`, FLUX-generated), warm off-white gradient overlay (left dark → right clear), headline bottom-left, gold CTA
- Mobile (<640px): content flows naturally (min-height auto, flex-start), CTAs stack full-width, stamp tucked top-right, headline clamp(2.4rem→3.2rem)

## Component Rules

- Buttons: 44px min-height, hover bg shift, active translateY(1px), :focus-visible teal ring
- Nav: sticky, paper/92 backdrop-blur, official circular logo (ilali-logo-76-t.png @ 40px)
- Footer: paper-warm, mono column headers, ink-faint links (no opacity text)
- Images: next/image always (hero fill+priority, art-studio 400x300)

## Official Logo

- Use the **-t transparent** versions: `ilali-logo-38-t.png`, `ilali-logo-76-t.png` (nav 40px), `ilali-logo-cropped-t.png` (metadata/OG)
- Originals (`ilali-logo-*.png`) have white boxes — do not use in UI

## Anti-Patterns

- No raw hex in components (use tokens)
- No opacity-based text (use ink-faint)
- No double-prefix token names (text-text-*, bg-bg-*)
- No more than 2 section eyebrows per page
- No numbered tags unless genuinely ordinal (steps 01/02/03 allowed)
- No icon-circle feature cards without color differentiation (accent bars used)
- No italic headers
- Inline body-copy links exempt from 44px touch rule (WCAG 2.5.8)

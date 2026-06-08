# ILALI Design System

> A child-safety-first marketplace connecting families with vetted activities and providers in Cape Town.

---

## Brand Identity

### Logo

The ILALI logo consists of a stylised letter "I" mark in teal within a playful, family-friendly design.

**Files:**
- **Full logo:** `/public/images/brand/ilali-logo-full.jpg` — Full brand lockup (984×924)
- **Favicon (SVG):** `/public/favicon.svg` — Teal circle with white "I" mark + gold star accent
- **Apple Touch Icon:** Uses the full logo image

**Usage:**
- **Header:** 38×38px cropped icon (object-left, scale-150)
- **Footer:** 36×36px cropped icon
- **Always** link back to `/`
- **Hover:** `opacity-90 transition-opacity`

**Do NOT:**
- Stretch, distort, or change the proportions
- Place on low-contrast backgrounds
- Add shadows, outlines, or effects
- Replace with text-only "ILALI" — use the image logo

---

## Color Palette

### Primary: ILALI (Teal/Cyan)

| Token | Hex | Usage |
|-------|-----|-------|
| `ilali-50` | `#f0fdfa` | Light backgrounds, active filter states, testimonial avatars |
| `ilali-100` | `#ccfbf1` | Light background tints, decorative blobs |
| `ilali-200` | `#99f6e4` | Gradient elements, card placeholder gradients |
| `ilali-300` | `#5eead4` | Hover borders for secondary elements |
| `ilali-400` | `#2dd4bf` | Active links, focus rings, secondary link color |
| `ilali-500` | `#14b8a6` | Stat numbers, accent text |
| `ilali-600` | `#0d9488` | **Primary brand color** — primary buttons, headings, key links |
| `ilali-700` | `#0f766e` | Primary button hover, dark text on light bg |
| `ilali-800` | `#115e59` | Reserved for deeper contrast |
| `ilali-900` | `#134e4a` | Reserved for deepest contrast |

### Accent: Sunset (Orange/Warm)

| Token | Hex | Usage |
|-------|-----|-------|
| `sunset-50` | `#fff7ed` | CTA section backgrounds |
| `sunset-100` | `#ffedd5` | CTA gradients |
| `sunset-200` | `#fed7aa` | Decorative blobs, decorative borders |
| `sunset-300` | `#fdba74` | Secondary button border (refer CTA) |
| `sunset-400` | `#fb923c` | Strong accent |
| `sunset-500` | `#f97316` | Icon accents (Heart icon in referral CTA) |
| `sunset-600` | `#ea580c` | Text on warm backgrounds |

### Highlight: Warm (Yellow/Gold)

| Token | Hex | Usage |
|-------|-----|-------|
| `warm-50` | `#fefce8` | Background tint in referral CTA |
| `warm-100` | `#fef9c3` | Decorative blurred blobs |
| `warm-200` | `#fef08a` | Accent elements |
| `warm-400` | `#facc15` | Star rating fill accent |
| `warm-500` | `#eab308` | Deep gold accent |

### Neutrals (Slate)

| Token | Hex | Usage |
|-------|-----|-------|
| `white` | `#ffffff` | Page backgrounds, card backgrounds, button text |
| `slate-50` | `#f8fafc` | Alternate section backgrounds (new providers, venues, partnership) |
| `slate-100` | `#f1f5f9` | Tab backgrounds (testimonial toggle), card borders |
| `slate-200` | `#e2e8f0` | Borders, dividers |
| `slate-300` | `#cbd5e1` | Secondary borders (outlined buttons) |
| `slate-400` | `#94a3b8` | Secondary text, placeholder text |
| `slate-500` | `#64748b` | Body text (secondary), muted labels |
| `slate-600` | `#475569` | Body text, hover text on light backgrounds |
| `slate-700` | `#334155` | Strong body text, dark button text (outlined) |
| `slate-800` | `#1e293b` | Card headings, strong text |
| `slate-900` | `#0f172a` | **Primary text color** — main headings, H1 text |
| `slate-950` (bg) | `#020617` | Footer background |

### Feedback Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `amber-400` | `#fbbf24` | Star rating fill (`fill-amber-400 text-amber-400`) |
| `green-100` | `#dcfce7` | "Free" badge background |
| `green-700` | `#15803d` | "Free" badge text |

---

## Typography

### Font Stack

- **Primary:** Inter (via `@fontsource/inter` with 400, 500, 600, 700, 800 weights)
- **Fallback:** `ui-sans-serif, system-ui, sans-serif`
- **CSS variable:** `--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif`

### Size Scale

| Usage | Class | Size |
|-------|-------|------|
| H1 (Hero) | `text-4xl sm:text-5xl lg:text-6xl font-extrabold` | 36px → 48px → 60px |
| H2 (Section) | `text-2xl sm:text-3xl font-bold` | 24px → 30px |
| H3 (CTA) | `text-xl sm:text-2xl font-bold` | 20px → 24px |
| Section heading | `text-lg font-bold` | 18px |
| Card title | `text-sm font-semibold` | 14px |
| Body | `text-sm sm:text-base` | 14px → 16px |
| Small / Labels | `text-xs` | 12px |
| Tiny (badges) | `text-[10px]` | 10px |
| Stats | `text-3xl sm:text-4xl font-extrabold` | 30px → 36px |

### Weights

| Weight | Usage |
|--------|-------|
| `font-extrabold` | H1, logo, stats numbers |
| `font-bold` | H2, H3 |
| `font-semibold` | Buttons, card titles, navigation, section links |
| `font-medium` | Nav links, dropdown labels, category names |
| `font-normal` | Body text, description paragraphs |

### Line Heights

- Headings: Tight tracking `tracking-tight`
- Body: `leading-relaxed`

---

## Components

### Buttons

**Primary (Solid Teal)**
- `rounded-full bg-ilali-600 text-white font-semibold`
- Hover: `hover:bg-ilali-700`
- Shadow: `shadow-md`
- Sizes:
  - Large (Hero): `px-8 py-3`
  - Default (CTA): `px-6 py-3`
  - Small (Header Sign In): `px-5 py-2`
- With icon: `inline-flex items-center gap-2`

**Secondary (Outlined)**
- `rounded-full border-2 border-slate-300 bg-white font-semibold`
- Hover: `hover:border-ilali-400 hover:text-ilali-600`
- Text: `text-slate-700`

**Ghost / Toggle**
- Tab-style: `rounded-full px-5 py-2 text-sm font-medium`
- Active: `bg-white text-slate-900 shadow-sm`
- Inactive: `text-slate-500 hover:text-slate-700`

**Utility / Clear filter**
- `rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50`

### Cards

**Category Card**
- `rounded-lg border border-slate-200 bg-white p-5 shadow-sm`
- Hover: `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`
- Icon: 48×48px rounded-full with category color
- Title: `text-sm font-semibold text-slate-800`
- Description: `text-xs text-slate-500 line-clamp-2`

**Provider Card**
- `rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden`
- Hover: `hover:shadow-lg hover:-translate-y-1 transition-all duration-200`
- Image area: 176px tall, gradient `from-ilali-200 to-sunset-200`
- Badges: `rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm`
- Price: `text-sm font-bold text-slate-900`
- Link: `text-xs font-medium text-ilali-600 group-hover:underline`

**Venue Card**
- `rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden`
- Hover: `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`
- Image area: 128px tall, gradient `from-slate-200 to-slate-300`
- Type badge: `rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium capitalize`

**Testimonial Card**
- `rounded-xl border border-slate-200 bg-white p-6 shadow-sm`
- Quote: `text-sm leading-relaxed text-slate-600 italic`
- Avatar: 40×40px `rounded-full bg-ilali-100 text-ilali-700 font-bold`

### Forms & Inputs

**Search Input (Large - Browse page)**
- `rounded-full border border-slate-200 bg-white py-4 pl-14 pr-6 shadow-md`
- Focus: `focus:border-ilali-400 focus:ring-2 focus:ring-ilali-100`
- Icon (Search): `absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400`

**Search Input (Compact - Header)**
- `rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4`
- Focus: same as large

**Filter Dropdown Button**
- `rounded-full border px-4 py-2 text-xs font-medium shadow-sm`
- Inactive: `border-slate-200 bg-white text-slate-700`
- Active: `border-ilali-400 bg-ilali-50 text-ilali-700`
- Chevron rotates on open

**Filter Dropdown Menu**
- `rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5`
- Options: `rounded-lg px-3 py-2.5 text-sm`
- Selected: `bg-ilali-50 text-ilali-700 font-medium`
- Checkbox: 16×16px `rounded border` - selected uses `bg-ilali-500 border-ilali-500`

### Navigation

**Header**
- Sticky: `sticky top-0 z-50 w-full bg-white shadow-sm border-b border-slate-200`
- Logo: 38×38px brand mark
- Links: `text-sm font-medium text-slate-600 hover:text-ilali-600 transition-colors`
- Container: `max-w-7xl mx-auto px-4 py-3`

**Footer**
- Background: `bg-slate-900 text-white`
- Logo: 36×36px brand mark
- Section headings: `text-xs font-semibold uppercase tracking-wider text-slate-300`
- Links: `text-sm text-slate-400 hover:text-white transition-colors`
- Container: `max-w-7xl mx-auto px-4 py-16`
- Bottom bar: `border-t border-slate-800`

---

## Spacing & Layout

### Container
- `max-w-7xl` (1280px) for all page content
- Padding: `px-4 sm:px-6 lg:px-8`

### Section Spacing
- Standard: `py-16 sm:py-20`
- Narrow: `py-12 sm:py-16`
- Compact: `py-8`
- Homepage sections alternate between `bg-white` and `bg-slate-50`

### Grids
- Categories: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4`
- Provider cards: `grid-cols-2 lg:grid-cols-4 gap-5`
- Venue cards: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5`
- Footer: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8`

### Cards Gap
- Provider/Venue grids: `gap-5`
- Category grid: `gap-4`

---

## Gradients & Decorative Elements

### Hero Background
```css
bg-gradient-to-br from-ilali-50 via-white to-sunset-50
```

### Decorative Blobs
- `.rounded-full bg-ilali-100/40 blur-3xl` — large teal blob
- `.rounded-full bg-warm-100/30 blur-3xl` — large yellow blob
- `.rounded-full bg-sunset-200/20 blur-2xl` — small warm blobs
- `.rounded-full bg-ilali-200/20 blur-2xl` — small teal blobs

### Card Placeholders
- Provider: `bg-gradient-to-br from-ilali-200 to-sunset-200`
- Venue: `bg-gradient-to-br from-slate-200 to-slate-300`

### CTA Section Gradients
- Provider CTA: `bg-gradient-to-br from-ilali-50 to-ilali-100`
- Referral CTA: `bg-gradient-to-br from-sunset-50 to-warm-50`

### Trust Banner
- `bg-ilali-600` — solid teal full-width section
- CTA button: `rounded-full bg-white text-ilali-700 hover:bg-ilali-50`

---

## Shadows

| Name | Class | Usage |
|------|-------|-------|
| Card | `shadow-sm` | Default card state |
| Card hover (Provider) | `shadow-lg` | Provider card hover |
| Card hover (Category/Venue) | `shadow-md` | Category/Venue card hover |
| Header | `shadow-sm` | Sticky header |
| Search bar (Large) | `shadow-md` | Browse page search |
| Filter dropdown | `shadow-xl ring-1 ring-black/5` | Open filter menus |
| Toggle active | `shadow-sm` | Active tab button |

---

## Transitions & Animations

### Standard Transition
```css
transition-colors
```
Used on: links, buttons, hover states.

### Card Hover Animations
```css
transition-all duration-200
hover:-translate-y-0.5   /* Category, Venue */
hover:-translate-y-1     /* Provider */
```

### Image Zoom on Hover
```css
transition-transform duration-300
group-hover:scale-105
```

### Fade-in-up Animation
```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
}
```

### Chevron Rotation
```css
transition-transform
open ? "rotate-180" : ""
```

---

## Scrollbar Styles

### Custom Thin Scrollbar
```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
```

### Hidden Scrollbar (Carousels)
```css
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

---

## Mobile Responsiveness

### Breakpoints
- `sm:` — 640px+
- `md:` — 768px+
- `lg:` — 1024px+
- `xl:` — 1280px+

### Mobile Carousels
- Card grids become horizontal scroll on mobile (`sm:hidden`)
- Snap scrolling: `snap-x snap-mandatory snap-start`
- Cards: `w-[280px] shrink-0`

### Mobile Menu (Header)
- Hidden on desktop, `md:hidden`
- Full-width panel below header on mobile

### Typography
- Headings scale down gracefully via `text-4xl sm:text-5xl lg:text-6xl`
- Sections use `py-16 sm:py-20`

---

## Partner Logos

### File Assets
- **ASSITEJ SA:** `/public/images/assitej/assitej-sa-logo.png`
- **BASA:** `/public/images/basa/basa-logo.png`

### Usage
Displayed in the partnership badge section at the bottom of the homepage, honoring: *"Built in partnership with ASSITEJ South Africa, with initial funding support from BASA through its Supporting Grants Programme."*

---

## Accessibility

- All images require `alt` text
- Interactive elements use `aria-label` where icon-only
- Skip navigation: Not yet implemented (TODO)
- Color contrast: Teal on white meets WCAG AA for large text; use `ilali-700` for small text on light backgrounds
- Focus states: `focus:outline-none focus:ring-2 focus:ring-ilali-100`
- Touch targets: Minimum 44×44px for mobile (buttons, links)
- Mobile menu button uses `aria-label={mobileOpen ? "Close menu" : "Open menu"}`

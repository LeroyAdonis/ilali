# Tasks: Main Navigation — Parent & Provider Entries

## Phase 1: Data + Desktop nav
- [x] T001 Add For Parents + For Providers to `navLinks` in `src/lib/constants.ts`
- [x] T002 Header desktop nav: split `navLinks` into top-level (Browse, Map, Categories, Community, Rewards) + More dropdown (How It Works, For Parents, For Providers, Contact)
- [x] T003 Dropdown behavior: click toggle, outside-click close, Esc close, `aria-expanded`, ChevronDown icon

## Phase 2: Profile entries
- [x] T004 Relabel parent pill → "Parent Profile" (`/home`), provider pill → "Provider Portal" (`/provider`) in desktop + mobile menus

## Phase 3: Verify
- [x] T005 `npx tsc --noEmit` clean
- [x] T006 `npx vitest run` green
- [x] T007 `npm run build` clean
- [x] T008 Manual QA: 375px mobile menu (all links incl. For Parents/For Providers), 768/1024/1440px no overflow, dropdown open/close, role pills per role
- [x] T009 Commit on main (no push unless asked)

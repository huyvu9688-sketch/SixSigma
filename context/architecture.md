# Architecture Context

## Stack

| Layer       | Technology                                      | Role                                   |
| ----------- | ----------------------------------------------- | -------------------------------------- |
| Framework   | Next.js 16 (App Router) + TypeScript            | Routing, rendering                     |
| UI          | Tailwind CSS v4 + shadcn/ui (`base-nova` style) | Component library and styling          |
| Theming     | `next-themes`                                   | Light/dark mode                        |
| Tables      | `@tanstack/react-table`                         | Work order data table                  |
| Charts      | `recharts`                                      | All charts                             |
| Drag & drop | `@dnd-kit/*`                                    | Reorderable table rows                 |
| Statistics  | `lib/six-sigma/stats.ts` (hand-written, no dep) | Every Six Sigma calculation            |
| Data        | Static JSON + `localStorage`                    | Dashboard mock data; Six Sigma project |
| Auth        | None                                            | Nav user is hardcoded                  |

## System Boundaries

- `app/` — routes only. Each route is a server component that renders `AppShell`
  plus one client tool component.
- `components/` — composite dashboard components and the 7QC tools.
- `components/six-sigma/` — the DMAIC tool cards (hub, charter, SIPOC, CTQ tree,
  cost of quality, sigma level, yield, capability, FMEA, Gage R&R, sample size,
  hypothesis test, attribute charts, control plan) plus `shared.tsx` for the
  editable-list and table-cell helpers they have in common.
- `components/calculator-primitives.tsx` — `useNumberField`, `Field`, `Result`,
  `TextField`, `SectionNote`, `ToolLink`, `SendButton`, `fmt`. Every calculator
  and tool imports its inputs and result tiles from here.
- `components/ui/` — shadcn/ui primitives. Generated/vendored; regenerate via
  `npx shadcn@latest add <name>` rather than hand-editing.
- `lib/six-sigma/` — the domain layer, framework-free apart from the store:
  - `stats.ts` — all math: descriptive statistics, normal and Student-t
    distributions, DPMO ↔ sigma, capability indices, yield chains, regression,
    control-chart limits (I-MR, X̄-R, p, np, c, u), the eight Nelson tests,
    sample-size formulas, Pareto ranking. No React import.
  - `constants.ts` — X̄-R constants (A2, D3, D4, d2), sigma reference levels,
    cost-of-quality bands, confidence/power levels, 6M categories, DMAIC phases.
  - `project-store.ts` — the shared project (see Storage Model).
- `lib/utils.ts` — re-exports `cn` from the `cn` package.
- `hooks/` — shared React hooks (`use-mobile`).
- `scripts/` — `verify-stats.ts` checks `stats.ts` against the reference guide's
  worked examples; run with `npm run verify:stats`.
- `ref/` — the Six Sigma reference guide the formulas come from.
- `public/brand/` — brand assets.

## Storage Model

Two separate things, neither of which is a backend:

1. **Dashboard mock data** — `app/data.json`, imported directly into
   `app/page.tsx` and passed to `DataTable`.
2. **The Six Sigma project** — one `Project` object in `localStorage` under
   `wanek-six-sigma-project`, exposed by `useSixSigmaProject()` in
   `lib/six-sigma/project-store.ts`. It is built on `useSyncExternalStore`: the
   server snapshot is the seeded example project, so server render and first
   client render agree, and the persisted copy takes over immediately after
   hydration with no `setState` inside an effect. `updateProject(updater)` writes
   through to storage and notifies every subscriber, so two tools showing the
   same field stay in step. Writes are wrapped in try/catch because storage can
   be unavailable (private windows, quota); the in-memory copy still works.
   Loading merges a stored project over the seed key by key, so a project saved
   before a field existed still opens. A `version` mismatch falls back to the
   seed rather than guessing.

## Auth and Access Model

**None.** `NavUser` is populated from a hardcoded object in
`components/app-sidebar.tsx`. There is no sign-in flow, session, or access
control, and the project data is per-browser rather than per-user.

## Invariants

1. **Math lives in `lib/six-sigma/stats.ts`, not in components.** Components
   parse inputs, call a pure function, and format the result. Anything that
   could be wrong in a way a reviewer would want to check belongs in `stats.ts`
   where `scripts/verify-stats.ts` can assert it.
2. **One project, one writer path.** Cross-phase data is read and written only
   through `useSixSigmaProject()` / `updateProject()`. Tool-local data that no
   other phase needs (OEE inputs, Gantt tasks, Gage R&R appraisals, scatter
   pairs, check-sheet grid) stays in component state.
3. Raw text inputs are stored as strings in the project and parsed at the point
   of use, so a half-typed number never destroys the field and a degenerate
   input renders `"—"` rather than a confidently wrong number.
4. Dashboard data flows one way: `app/data.json` → `app/page.tsx` → presentational
   components. Components under `components/` do not fetch their own data.
5. `components/ui/*` are generated library code — prefer the shadcn CLI to
   add/upgrade rather than freehand edits.
6. All colors/spacing/radii go through the CSS custom properties in
   `app/globals.css` — no hardcoded hex values in components.
7. Client-side interactive components are marked `"use client"`; route files stay
   server components that render one client tool.
8. No `setState` inside an effect. External state is read with
   `useSyncExternalStore` (`use-mobile`, the project store); state that depends
   on props is derived during render or adjusted with the previous-value-in-state
   pattern (`nav-main`, `chart-area-interactive`).

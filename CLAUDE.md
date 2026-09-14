# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: read this first

`AGENTS.md` in this repo states that the installed Next.js version has breaking changes vs. training data — APIs, conventions, and file structure may differ. Check `node_modules/next/dist/docs/` for the relevant guide before writing Next.js code, and heed deprecation notices.

## Commands

Run from `next-app/` (the actual project root — the repo root above it contains nothing else).

- `npm run dev` — start the dev server (Next.js)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript rules)
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` — Prettier write across `**/*.{ts,tsx}` (uses `prettier-plugin-tailwindcss` for class sorting)
- `npm run verify:stats` — compiles and runs `scripts/verify-stats.ts`, which checks every formula in `lib/six-sigma/stats.ts` against the worked examples in `ref/Six-Sigma-A-Complete-Step-by-Step-Guide.md`

There is no test runner configured in `package.json`. `npm run verify:stats` is the only automated correctness check — add a case to it whenever you add or change a formula.

Known: `npm run lint` reports one pre-existing error in `components/ui/carousel.tsx` (setState in an effect). That file is vendored shadcn code; regenerate it via the CLI rather than hand-editing.

### Adding shadcn/ui components

```bash
npx shadcn@latest add <component>
```

This places generated components in `components/ui/`. Style is `base-nova` with `stone` as the base color (see `components.json`); import via the `@/components/ui/<name>` alias.

## Architecture

This is a Next.js (App Router) internal app for **Wanek Furniture**: a shop-floor dashboard plus a connected set of Six Sigma tools organised around DMAIC. The methodology and every formula come from `ref/Six-Sigma-A-Complete-Step-by-Step-Guide.md`.

- **`app/`** — App Router routes only. `app/page.tsx` is the dashboard; `app/six-sigma/*` and `app/calculators/*` and `app/qc-tools/*` are one route per tool, each a server component rendering `AppShell` plus one client tool component. `app/showcase/page.tsx` is a kitchen-sink reference page, not part of the product. `app/data.json` is static mock data for `DataTable`.
- **`lib/six-sigma/`** — the domain layer:
  - `stats.ts` — **all** the math, as pure functions with no React import: descriptive statistics, normal and Student-t distributions, DPMO ↔ sigma level (1.5σ shift), Cp/Cpk, FTY/RTY, regression, control-chart limits (I-MR, X̄-R, p, np, c, u), the eight Nelson special-cause tests, sample-size formulas, Pareto ranking.
  - `constants.ts` — reference tables (X̄-R factors, sigma levels, cost-of-quality bands, DMAIC phases, 6M categories).
  - `project-store.ts` — one shared Six Sigma project in `localStorage`, read via `useSyncExternalStore` with the seeded example as the server snapshot. Every DMAIC tool reads and writes it through `useSixSigmaProject()`, which is what links the phases together.
- **`components/six-sigma/`** — the DMAIC tool cards (hub, charter, SIPOC, CTQ tree, cost of quality, sigma level, yield, capability, FMEA, Gage R&R, sample size, hypothesis test, attribute charts, control plan) and `shared.tsx` for their common list/table helpers.
- **`components/calculator-primitives.tsx`** — `useNumberField`, `Field`, `Result`, `TextField`, `SectionNote`, `ToolLink`, `SendButton`, `fmt`. Every tool imports its inputs and result tiles from here.
- **`components/`** — the dashboard components and the 7QC tools (`pareto-chart`, `histogram-chart`, `control-chart`, `scatter-diagram`, `check-sheet`, `gantt-chart`, `root-cause-analysis`, `value-stream-map`, `muda-calculator`, `production-calculators` for OEE and takt/line balance).
- **`components/ui/`** — shadcn/ui primitives (generated/vendored) — treat as library code; regenerate via the shadcn CLI rather than hand-editing.
- **`scripts/verify-stats.ts`** — asserts `stats.ts` against the guide's worked examples.
- **`lib/utils.ts`** — re-exports `cn` from the `cn` package (not the usual clsx+tailwind-merge helper).
- **`hooks/`** — shared React hooks (`use-mobile.ts`, built on `useSyncExternalStore`).
- **Path alias**: `@/*` maps to the `next-app/` root (see `tsconfig.json`).
- **Styling**: Tailwind v4 (via `@tailwindcss/postcss`), tokens in `app/globals.css`, dark mode via `next-themes` (`ThemeProvider` in `app/layout.tsx`; `TooltipProvider` is also global).
- **Fonts**: Roboto (`--font-sans`) and Geist Mono (`--font-mono`) via `next/font/google`.
- **Sidebar**: `AppSidebar` holds the nav data inline, grouped by DMAIC phase; `NavMain` takes `sections`, renders group labels, and opens the group containing the current route. Page content is wrapped by `SidebarProvider`/`SidebarInset` through `components/app-shell.tsx`.
- **Charts**: `recharts` everywhere, via `components/ui/chart.tsx`.
- **Brand asset**: `public/brand/wanek-logo.webp`, in the sidebar header.

## Rules that matter most here

1. **Formulas live in `lib/six-sigma/stats.ts`**, never inline in a component, and every new one gets a check in `scripts/verify-stats.ts`.
2. **Never clamp a result to hide bad input.** Flag the impossible figure or render `"—"`; a confidently wrong number is the worst outcome in a quality tool.
3. **Cross-phase data goes through the project store**, tool-local data stays in component state.
4. **No `setState` inside an effect** — the React lint rules treat it as an error. Use `useSyncExternalStore` for external state, derive from props otherwise.

## Spec-driven workflow (`context/`)

This project follows the workflow defined in `context/ai-workflow-rules.md` — read it before implementing anything non-trivial. In short:

- `context/project-overview.md` — what this app is and its scope
- `context/architecture.md` — stack, boundaries, invariants
- `context/code-standards.md` — conventions
- `context/ui-context.md` — design tokens, typography, layout patterns
- `context/progress-tracker.md` — current state; update it after meaningful changes
- `context/ai-workflow-rules.md` — the rules governing how work should be scoped and split

Do not invent product behavior not defined in these files; if something is missing or ambiguous, resolve it in the relevant context file (or log it as an open question in `progress-tracker.md`) before implementing.

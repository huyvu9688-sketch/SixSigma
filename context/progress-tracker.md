# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- The DMAIC tool system is built and wired together. The dashboard shell and the
  lean calculators from earlier work are unchanged apart from shared-primitive
  extraction and the OEE performance fix.

## Current Goal

- No active build goal. Last completed: full Six Sigma DMAIC system, project
  audit, and the fixes listed below (2026-09-14).

## Completed

### Foundation (earlier work)

- Next.js App Router project with shadcn/ui (`base-nova`), Tailwind v4, theming.
- Dashboard shell: `AppSidebar`, `SiteHeader`, `SidebarProvider`/`SidebarInset`.
- Dashboard content: `SectionCards`, `ChartAreaInteractive`, `DataTable`.
- Lean calculators: OEE (bento grid, `useOeeCalculator`), Takt Time & Line
  Balance (`TaktLineBalanceCalculatorCard`, served at `/calculators/balance`,
  with `/calculators/takt` redirecting there). Takt/line-balance math was
  audited against IE/lean references on 2026-09-11 — required staff derives from
  the process/step totals, degenerate inputs render `"—"`, and balance loss,
  smoothness index and shift-capacity-vs-demand are surfaced.
- 7QC tool pages (Pareto, cause & effect, check sheet, control chart, histogram,
  scatter, Gantt) and the VSM / Muda / root-cause calculators.
- Component showcase page (`app/showcase`) for visual QA of `components/ui/*`.

### Six Sigma DMAIC system (2026-09-14)

Design spec: `docs/superpowers/specs/2026-09-14-six-sigma-dmaic-system-design.md`.
All formulas trace to `ref/Six-Sigma-A-Complete-Step-by-Step-Guide.md`; the spec
carries a table of the guide line numbers behind each one.

- **Domain layer** `lib/six-sigma/`:
  - `stats.ts` — descriptive statistics, Abramowitz–Stegun `erf` and Acklam
    inverse normal, DPMO ↔ sigma with the 1.5σ shift, Cp/Cpk/Cpu/Cpl plus
    sigma level and ppm out of spec, FTY/RTY chains, linear regression,
    I-MR / X̄-R / p / np / c / u control limits, the eight Nelson tests,
    Student-t via the regularized incomplete beta (1- and 2-sample Welch t),
    sample-size formulas, Sturges binning, Pareto ranking.
  - `constants.ts` — X̄-R constants (A2/D3/D4/d2 for n = 2..10), sigma reference
    levels, cost-of-quality-by-sigma bands, confidence and power levels,
    6M categories, DMAIC phases.
  - `project-store.ts` — the one shared project, persisted to `localStorage` and
    read through `useSyncExternalStore` with the seeded example as the server
    snapshot (so no hydration mismatch and no setState-in-effect). Seeded with a
    coherent factory example: scratches on Line 3 sofa frames, 1,480 defects in
    12,000 frames, which is a 3.24σ process costing $51,800.
- **Verification**: `scripts/verify-stats.ts` (`npm run verify:stats`) asserts
  `stats.ts` against the guide's worked examples — the sigma/DPMO table, the
  DPMO forms example, the FTY/RTY chain, the USL 5 / LSL 3 capability example,
  the I-MR and p/c/u chart limits, the A2 factor, Nelson tests, z and t values,
  and Pareto's vital-few rule. All pass.
- **Shared primitives** moved out of the 1,300-line `production-calculators.tsx`
  into `components/calculator-primitives.tsx` (`useNumberField`,
  `useSignedNumberField`, `Field`, `TextField`, `Result`, `SectionNote`,
  `ToolLink`, `SendButton`, `fmt`). Every tool imports from there;
  `production-calculators.tsx` is now OEE + takt/line balance only (935 lines).
  `components/six-sigma/shared.tsx` adds `EditableTextList`, `CellInput` and
  `FlowFooter` for the list- and table-shaped tools.
- **New tools** (all under `components/six-sigma/`, each on its own route):
  hub `/six-sigma`, charter, SIPOC, CTQ tree, cost of quality, sigma level
  (`/calculators/six-sigma`, replacing the old combined card), yield (FTY/RTY),
  capability, FMEA, Gage R&R, sample size, hypothesis test, attribute charts,
  control plan.
- **Rebuilt existing tools** to read the shared project and link onward:
  control chart (now I-MR **and** X̄-R, with the moving-range/range chart, the
  1σ/2σ zone bands, and all eight tests reported by number), Pareto (vital few
  filled solid, trivial many muted), histogram (shared data set, skew read-out,
  out-of-spec bars in red), scatter (r², labelled axes), root cause (5 Whys with
  a process-level check, fishbone with per-category counts and dashed empty
  ribs), check sheet (row totals, worst period, send-to-Pareto).
- **Navigation** regrouped by DMAIC phase in `app-sidebar.tsx`; `NavMain` now
  takes `sections`, renders group labels, marks the active item, uses `Link`
  for plain items, and opens the group containing the current page.

### Audit fixes (2026-09-14)

- **Pareto contradicted its own comment.** `vitalFew` filtered categories with
  cumulative ≤ 80%, so the category that crosses the line was excluded and the
  count was wrong whenever no category landed exactly on 80%. Now in
  `pareto()` in `stats.ts`, asserted by the verify script.
- **Scatter plotted blank rows as (0, 0).** The chart passed every row through
  `Number(p.x)`, so an empty row became the origin and dragged the visual
  relationship toward it while the statistics (which filtered correctly)
  disagreed with the plot. Only complete pairs are plotted now, and the count of
  excluded rows is shown.
- **OEE performance was silently clamped to 150%.** A wrong ideal cycle time
  produced a plausible-looking score instead of an error. Performance is now
  reported as measured and anything over 100% is flagged as a data problem, with
  the chart axis extending so the bar is not clipped.
- **`chart-area-interactive` fought the user.** An effect forced the range to
  "7d" whenever `isMobile` was true, so on a narrow window the choice reset on
  every resize. The range is now derived, with an explicit pick winning.
- **Ref access during render** in the old `useFishbone` (lint error) — the seed
  ids came from a ref incremented inside a `useState` initializer. Seeds are now
  deterministic and runtime ids come from `newId()`.
- **Mutable accumulator across render** in `pareto-chart` (lint error) — the
  cumulative percentage used a reassigned `let` in module-ish scope; now a
  `reduce`.
- **setState-in-effect** in `theme-toggle` (replaced with a CSS-driven icon and a
  DOM read at click time), `use-mobile` (now `useSyncExternalStore`), and
  `chart-area-interactive` (above).
- Unescaped apostrophes in `data-table` and `check-sheet`, unused `Geist` import
  in `app/layout.tsx`, unused destructured `_removed` in `check-sheet`.
- **Dashboard link pointed at `#`.** The sidebar logo and the Dashboard item now
  link to `/`.
- The Six Sigma calculator's dead `isCurrent` field and its O(n²) closest-row
  scan are gone; `erf`/`normalCdf` moved into `stats.ts`, and sigma is now solved
  with an inverse-normal call rather than a 60-iteration bisection.
- Histogram's "0 = auto" suffix hack on a numeric field became a bin-count
  select that names Sturges' rule.

### Multiple projects (2026-10-08)

- Project store is now a workspace of projects with an active id; new
  `ProjectSwitcher` in the sidebar header creates (blank, Define phase),
  switches, renames and deletes projects. Existing single-project data migrates
  in as the first project. Tools are unchanged.

## In Progress

- None.

## Next Up

- Decide whether the remaining placeholder routes (Production Lines,
  Quality (SPC), Inventory/WIP, Downtime Events) get built or removed from the
  sidebar. They are grouped under "Shop floor" and still point to `#`.
- Consider a variable (measured) Gage R&R, which needs an analysis of variance.
- Consider export of the charter and control plan for printing or sharing.

## Open Questions

- Will there be a real backend? The Six Sigma project is per-browser, so two
  people cannot work the same project, and clearing site data loses it.
- Is authentication in scope? `NavUser` data is still hardcoded.
- Should the dashboard's headline cards read from the Six Sigma project instead
  of the hardcoded figures in `section-cards.tsx`?

## Architecture Decisions

- **Math separated from UI.** Every calculation lives in `lib/six-sigma/stats.ts`
  as a pure function so it can be checked against the reference guide by a
  script. There is no test runner in this project; `npm run verify:stats`
  compiles the checks with a scoped tsconfig into `node_modules/.cache` and runs
  them, which keeps the output out of the lint and git paths.
- **One shared project rather than per-tool state.** A Six Sigma project is a
  single artifact whose phases hand work to each other, so the tools share one
  store. Tool-local inputs that no other phase needs stay in component state.
- **`useSyncExternalStore` for the store**, with the seed as the server snapshot.
  This gives a clean hydration story and matches the no-setState-in-effect rule
  the new React lint rules enforce.
- **Navigation grouped by DMAIC phase** rather than by tool type, so the sidebar
  reads as the order the work is actually done in.
- `components/ui/*` treated as generated/vendored shadcn code.

## Known Issues

- `components/ui/carousel.tsx` has a `react-hooks/set-state-in-effect` lint
  error, so `npm run lint` reports one error. It is vendored shadcn code that
  `architecture.md` says to regenerate rather than hand-edit, and it predates
  this work. `npm run typecheck` and `npm run build` both pass clean.

## Session Notes

- 2026-09-14: project audited and the DMAIC system built in one pass. Verified
  with `npm run typecheck`, `npm run lint`, `npm run build`, `npm run
  verify:stats`, and a production server run checking all 27 routes return 200
  with the expected computed values in the HTML (sigma level 3.24σ, DPMO 41,111,
  yield 95.89%, Pareto vital few 3 of 7 at 40.6% top category, p-chart p̄ 0.0215
  with UCL 0.0650 and test-1 failures at samples 11, 13 and 19 — which matches
  the guide's own worked example).
- `context/` files were previously present only as macOS AppleDouble artifacts;
  real versions were supplied on 2026-09-11.

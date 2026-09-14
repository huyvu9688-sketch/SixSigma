# Six Sigma DMAIC System — Design

Date: 2026-09-14
Status: approved-by-default (user asked for the full system in one autonomous run; no review gate was available)

## Goal

Turn the loose set of calculators and 7QC tool pages into one connected Six Sigma
improvement system that follows the DMAIC flow described in
`ref/Six-Sigma-A-Complete-Step-by-Step-Guide.md`. Every tool reads from and writes
to a single per-browser "project" so outputs of one phase feed the next
(check sheet → Pareto → fishbone → FMEA → control plan, data set → histogram →
capability → control chart, DPMO baseline → charter → hub KPIs).

## Source of formulas (guide references)

| Tool | Guide section (line) | Formula / rule |
| --- | --- | --- |
| Sigma level table | 275–334 | 1σ 690,000 · 2σ 308,000 · 3σ 66,800 · 4σ 6,200 · 5σ 233 · 6σ 3.4 DPMO (1.5σ shift convention) |
| DPMO / DPU / FTY / RTY | 3083–3208 | DPMO = defects ÷ (units × opportunities) × 1e6; DPU = defects ÷ units; FTY = good ÷ in; RTY_step = (in − (scrap + rework)) ÷ in; overall = Π steps |
| CoPQ / CoQ | 4619–4754 | CoPQ = external + internal failure; CoQ = CoPQ + prevention + appraisal; CoQ % of sales by sigma: 2σ >40 %, 3σ 25–40 %, 4σ 15–25 %, 5σ 5–15 %, 6σ <1 % |
| Charter | 6961–7009, 7371–7412 | problem statement, CTQs, team/roles, customers, sponsor, duration, scope, business case, schedule |
| SIPOC | 3940–3960 | Suppliers, Inputs, Process, Outputs, Customers swim lanes |
| CTQ tree | 4484–4538 | need → drivers → measurable requirements |
| FMEA | 7446–7551 | 15 columns; RPN = SEV × OCC × DET (1–10 each); rescore after actions |
| Attribute Gage R&R | 7857–8069 | repeatability per appraiser, reproducibility across appraisers, accuracy vs. reference; ≥20 samples preferred |
| Sampling | 8203–8247, 14595–14664 | random / stratified / sequential; sample-size by test type, α, β |
| Control chart tests | 9722–9803 | zones A/B/C at 1/2/3σ, eight tests (Nelson rules) |
| Chart selection | 15011–15103 | I-MR, X̄-R (n < 8), X̄-S (n ≥ 8), p, np, c, u |
| Sigma level from spec | 9831–9848 | Z = min((USL − x̄)/σ, (x̄ − LSL)/σ); Cpk = Z ÷ 3; 1.33 ≈ 4σ; aim 2.0, minimum 1.5 |
| Control plan | 9525–9662 | columns: step, CTQ/metric, limits, unit, method, sample size, frequency, who, record, corrective action |

## Architecture

### Shared library `lib/six-sigma/`

- `stats.ts` — pure, unit-testable math: mean, sample/population stdDev, erf,
  normal CDF, normal quantile, dpmo↔sigma, Cp/Cpk/Cpu/Cpl, FTY/RTY, Sturges bins,
  linear regression (r, r², slope), I-MR / X̄-R / p / np / c / u control limits,
  Nelson eight tests, Student-t CDF (regularized incomplete beta) for t-tests,
  sample-size formulas. No React in this file.
- `constants.ts` — X̄-R constants A2/D3/D4/d2 (n = 2..10), sigma reference levels,
  CoQ-by-sigma table, z-values for common confidence/power.
- `project-store.ts` — one `Project` object persisted to `localStorage`
  (`wanek-six-sigma-project`), exposed through `useSixSigmaProject()` built on
  `useSyncExternalStore` (server snapshot = seeded example, so no
  setState-in-effect and no hydration mismatch after first client render).
  `updateProject(patch | updater)` writes and notifies. `resetProject()` restores
  the seed. The seed is one coherent factory example (Line 3 finishing —
  scratches on sofa frames) so every tool opens with meaningful, linked data.

### Project shape (persisted)

```
Project {
  name, phase: "define"|"measure"|"analyze"|"improve"|"control"
  charter: { problem, goal, businessCase, scopeIn, scopeOut, sponsor,
             team: {id,name,role}[], customersInternal, customersExternal,
             ctqs: {id,need,driver,requirement,unit,lsl,usl}[],
             schedule: Record<phase, string> }
  sipoc: { suppliers, inputs, process, outputs, customers }  // string[] each
  baseline: { units, opportunities, defects, costPerDefect }   // strings (raw inputs)
  improved: same as baseline (after-state, optional)
  copq: { externalFailure, internalFailure, prevention, appraisal, sales } // strings
  measurementsRaw: string          // continuous data set, shared
  spec: { usl, lsl, target, unit } // strings
  defectCategories: {id,name,count}[]
  fishbone: { effect, causes: Record<6M, {id,text}[]> }
  fiveWhys: { problem, whys: {id,text}[] }
  fmea: FmeaRow[]
  controlPlan: ControlPlanRow[]
  tollgates: Record<phase, Record<string, boolean>>
}
```

Tools with data that is *not* cross-linked (OEE, takt, VSM, muda, gantt,
scatter, check-sheet periods, gage R&R, sample size, hypothesis test) keep local
component state as today. The check sheet gets a "Send totals to Pareto" action.

### Shared UI primitives `components/calculator-primitives.tsx`

`useNumberField`, `Field`, `Result` move out of the 1,300-line
`production-calculators.tsx` (which every other tool currently imports from).
Add `ToolLink` (small "Send to → X" / "Open X" button rendered as `next/link`)
and `SectionNote` (muted formula footnote).

### Routes and navigation

Existing routes stay. New tool pages live under `app/six-sigma/<tool>/page.tsx`
and are server components that render one client card, like the existing ones.

Sidebar (`components/app-sidebar.tsx`) is regrouped by DMAIC phase; each phase is
a collapsible group that auto-opens when a child route is active
(`NavMain` gets `defaultOpen` from `pathname`). Dashboard links to `/`.

| Group | Links |
| --- | --- |
| DMAIC Project | `/six-sigma` (hub: phase stepper, live KPIs, tollgate checklists, tool map) |
| Define | Charter `/six-sigma/charter`, SIPOC `/six-sigma/sipoc`, CTQ Tree `/six-sigma/ctq`, Cost of Quality `/six-sigma/cost-of-quality` |
| Measure | Sigma Level `/calculators/six-sigma`, Yield FTY/RTY `/six-sigma/yield`, Capability `/six-sigma/capability`, FMEA `/six-sigma/fmea`, Gage R&R `/six-sigma/gage-rr`, Sample Size `/six-sigma/sample-size`, Check Sheet `/qc-tools/check-sheet` |
| Analyze | Pareto, Histogram, Scatter, Cause & Effect, 5 Whys `/calculators/root-cause`, Hypothesis Test `/six-sigma/hypothesis-test` |
| Improve | Implementation Plan (Gantt) `/qc-tools/gantt`, FMEA rescoring (same FMEA page, "after" columns) |
| Control | Control Chart `/qc-tools/control-chart`, Attribute Charts `/six-sigma/attribute-chart`, Control Plan `/six-sigma/control-plan` |
| Lean | OEE, Takt & Line Balance, VSM, Muda |

### Tool links (data flow)

```
Check sheet ──totals──▶ Pareto (defectCategories) ──top category──▶ Fishbone.effect
Fishbone.causes ──▶ FMEA rows (potential cause / failure)  ──top RPN──▶ Hub KPI
Charter.ctqs + spec ──▶ Control plan rows;  Charter.problem ──▶ 5 Whys.problem
measurementsRaw ──▶ Histogram ──▶ Capability (mean, σ from data) ──▶ Control chart
Baseline (DPMO) ──▶ Hub sigma level, CoPQ estimate;  Improved ──▶ Hub before/after
Capability (Cpk) ──▶ Hub;  Control chart tests ──▶ Hub "in control?" flag
```

## Audit fixes included (existing code)

1. Pareto "vital few" counted categories *under* 80 %, contradicting its own
   comment; now counts up to and including the category that crosses 80 %.
2. Scatter plotted blank rows as (0, 0); now plots only parsed pairs; adds r².
3. Sidebar: Dashboard pointed to `#`; phase groups did not open on their active
   child; plain items used `<a>` instead of `Link`.
4. Six Sigma calculator: redundant `tone` expression, dead `isCurrent` field,
   O(n²) closest-row lookup; erf/normal helpers moved to `lib/six-sigma/stats.ts`.
5. OEE performance silently capped at 150 %; now flagged as a data problem
   (performance > 100 % means ideal cycle time is wrong) instead of clamped.
6. Lint errors: setState-in-effect in `theme-toggle`, `use-mobile`,
   `chart-area-interactive`; ref access during render in `root-cause-analysis`;
   mutable `running` reassignment in `pareto-chart`; unescaped apostrophes;
   unused imports/vars. `components/ui/carousel.tsx` is vendored and left alone.
7. Control chart: only "beyond limits" was tested; now I-MR with MR chart,
   zones, all eight tests, plus X̄-R for subgrouped data.
8. Histogram bins field used a "0 = auto" suffix hack; replaced with a select.
9. `Field` className concatenation → `cn`.

## Out of scope

Backend/API, auth, multi-project management (one project per browser),
Minitab-grade statistics (ANOVA, DOE, regression beyond simple linear,
normality tests), variable Gage R&R (needs ANOVA), export to PDF/Excel.

## Testing

No test runner exists. Pure math in `lib/six-sigma/stats.ts` is verified
against the worked examples in the guide via a Node script run during this
task (`scripts/verify-stats.mjs`, checked into the repo so it can be re-run with
`node --experimental-strip-types`-free plain JS after `tsc`). Pages are
verified with `npm run typecheck`, `npm run lint`, and `npm run build`.

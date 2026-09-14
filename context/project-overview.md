# Wanek Furniture — Shop Floor Dashboard & Six Sigma Workbench

## Overview

An internal manufacturing application for Wanek Furniture. It combines a
shop-floor dashboard (work orders, line output, headline metrics) with a
connected set of Six Sigma tools organised around DMAIC, so an improvement
project can be run end to end without leaving the app or opening a spreadsheet.

The Six Sigma tools follow the methodology and formulas in
`ref/Six-Sigma-A-Complete-Step-by-Step-Guide.md` (Council for Six Sigma
Certification, 2018 edition).

## Goals

1. Give shop-floor and office staff a view of work order status across lines.
2. Run a complete DMAIC improvement project: define the problem, measure the
   baseline, find the root cause, prove the improvement, and hold the gain.
3. Make the tools a system rather than a drawer of calculators — the output of
   one phase is the input to the next, carried by a single shared project.
4. Keep a consistent, reusable UI foundation (shadcn/ui + Tailwind tokens).

## The DMAIC system

One **project** (`lib/six-sigma/project-store.ts`) is shared by every tool and
persisted in the browser. The project hub at `/six-sigma` shows the current
phase, live metrics derived from whatever has been entered, and the tollgate
checklist for each phase.

### Data flow between tools

```text
Check sheet ──row totals──▶ Pareto ──top category──▶ Fishbone effect + 5 Whys problem
Fishbone causes ──▶ FMEA rows ──highest RPN──▶ Hub
Charter CTQs + spec limits ──▶ Control plan rows, Capability limits
Shared measurement set ──▶ Histogram, Capability, Control chart, Sample size, Hypothesis test
Baseline defect rate ──▶ Sigma level, Cost of quality, Charter, Hub
After-state defect rate ──▶ Sigma gain and cost saved on the Hub
```

### Tools by phase

| Phase | Tool | Route |
| --- | --- | --- |
| — | Project hub | `/six-sigma` |
| Define | Project charter (problem statement checks, goal, scope, team, schedule) | `/six-sigma/charter` |
| Define | SIPOC diagram | `/six-sigma/sipoc` |
| Define | CTQ tree | `/six-sigma/ctq` |
| Define | Cost of quality (CoPQ / CoQ vs. sigma benchmark) | `/six-sigma/cost-of-quality` |
| Measure | Sigma level & DPMO, before/after, reference table | `/calculators/six-sigma` |
| Measure | Yield: FTY, RTY and the hidden factory | `/six-sigma/yield` |
| Measure | Process capability (Cp, Cpk, sigma level, ppm out of spec) | `/six-sigma/capability` |
| Measure | FMEA with RPN and rescoring | `/six-sigma/fmea` |
| Measure | Attribute Gage R&R | `/six-sigma/gage-rr` |
| Measure | Sample size and sampling strategy | `/six-sigma/sample-size` |
| Measure | Check sheet | `/qc-tools/check-sheet` |
| Analyze | Pareto analysis | `/qc-tools/pareto` |
| Analyze | Histogram | `/qc-tools/histogram` |
| Analyze | 5 Whys & fishbone | `/calculators/root-cause`, `/qc-tools/cause-effect` |
| Analyze | Scatter diagram with regression | `/qc-tools/scatter` |
| Analyze | Hypothesis test (1- and 2-sample t) | `/six-sigma/hypothesis-test` |
| Improve | Implementation plan (Gantt) | `/qc-tools/gantt` |
| Improve | Value stream map, Muda, Takt & line balance, OEE | `/calculators/*` |
| Control | Control chart: I-MR and X̄-R with the eight tests | `/qc-tools/control-chart` |
| Control | Attribute charts: p, np, c, u | `/six-sigma/attribute-chart` |
| Control | Control plan | `/six-sigma/control-plan` |

## Features

### Dashboard

- Summary metric cards (`SectionCards`)
- Interactive area chart of production trends (`ChartAreaInteractive`)
- Work order data table with drag-to-reorder rows (`DataTable`)

### Navigation shell

- Sidebar grouped by DMAIC phase; the group containing the current page opens
  automatically. Light/dark theming via `next-themes`.

### Component showcase

- `app/showcase/page.tsx` renders `components/ui/*` primitives for visual QA —
  not a product page.

## Scope

### In Scope

Dashboard shell, work order table, the DMAIC tool set above, the lean
calculators, dark/light theme, shadcn/ui integration.

### Out of Scope (not implemented)

- Real backend or data source (dashboard data is static `app/data.json`;
  the Six Sigma project lives in browser storage)
- Auth / user accounts (nav user is hardcoded)
- Multiple concurrent projects (one project per browser)
- Minitab-grade statistics: ANOVA, design of experiments, normality tests,
  multiple regression, variable (measured) Gage R&R
- Export to PDF or Excel
- The placeholder "Shop floor" sidebar links (Production Lines, Quality (SPC),
  Inventory/WIP, Downtime Events) still point to `#`

## Success Criteria

1. A user can carry one improvement project through all five DMAIC phases using
   the app alone, with each phase's output feeding the next.
2. Every statistic matches the formulas in the reference guide; the checks in
   `scripts/verify-stats.ts` assert this against the guide's worked examples.
3. A user can view current work order status per line at a glance.
4. New shadcn/ui components can be added via the CLI and slot into the theme.

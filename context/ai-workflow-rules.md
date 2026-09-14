# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow. `project-overview.md`, `architecture.md`, `code-standards.md`, and `ui-context.md` define what to build, how to build it, and the conventions to follow. `progress-tracker.md` records current state. Always implement against these specs — do not infer or invent product behavior from scratch.

## Scoping Rules

- Work on one feature unit at a time (e.g. one calculator, one nav section, one table feature).
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step (e.g. don't touch `components/ui/*` primitives and dashboard business logic in the same change).

## When to Split Work

Split an implementation step if it combines:

- UI/layout changes and data-model or calculation logic changes
- Multiple unrelated dashboard sections (e.g. sidebar nav and the data table)
- Behavior not clearly defined in the context files — wiring up one of the placeholder nav routes (Production Lines, Quality (SPC), Maintenance, Inventory/WIP, etc.) is undefined product behavior until scoped in `project-overview.md`

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files (e.g. don't design a real backend or auth flow unprompted — those are explicitly out of scope today).
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — shadcn/ui generated library components; regenerate via `npx shadcn@latest add <name>` instead of hand-editing
- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs` — project tooling config
- `app/data.json` — mock data; only change when the task is specifically about the data set

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries → `architecture.md`
- Storage model decisions → `architecture.md`
- Code conventions or standards → `code-standards.md`
- Visual language / tokens / layout patterns → `ui-context.md`
- Feature scope → `project-overview.md`

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work
4. `npm run build` (or at minimum `npm run typecheck` and `npm run lint`) passes

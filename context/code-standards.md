# Code Standards

## General

- Keep feature components in `components/` focused on one part of the app; keep `components/ui/*` free of app-specific logic.
- Prefer fixing root causes over adding workarounds; don't over-engineer.
- Don't mix unrelated concerns (e.g. layout shell changes and calculator math) in one change.

## Statistics and domain logic

- **Every calculation goes in `lib/six-sigma/stats.ts` as a pure function.** Components parse inputs, call it, and format the output. Never inline a formula in JSX.
- Add a check to `scripts/verify-stats.ts` for any new formula, ideally against a worked example in `ref/Six-Sigma-A-Complete-Step-by-Step-Guide.md`, and run `npm run verify:stats`. This is the only automated test coverage in the project.
- Cite the source in a comment when a constant is not self-evident (control-chart factors, the 1.5σ shift, capability thresholds).
- **Never clamp a result into a plausible range to hide bad input.** If a figure is impossible (performance above 100%, a negative count, a sample too small for the index), compute it honestly and flag it, or render `"—"` with neutral tone. A confidently wrong number is worse than a blank.
- Degenerate inputs (zero denominators, empty data sets, one spec limit where two are needed) must produce `"—"`, not zero.

## Shared project state

- Cross-phase data is read and written only through `useSixSigmaProject()` and `updateProject()` from `lib/six-sigma/project-store.ts`. Adding a field means adding it to `Project`, to `createSeedProject()`, and to the merge in `mergeWithSeed` if it is nested.
- Store raw user text as strings in the project and parse at the point of use, so a half-typed value never destroys the field.
- Tool-local state that no other phase needs stays in component state.
- Generate ids for user-created rows with `newId()`. Never call it during render — seed data uses fixed ids so server and client agree.

## React

- **No `setState` inside an effect.** Read external systems with `useSyncExternalStore`; derive state from props during render; if state genuinely has to reset when a prop changes, keep the previous value in state and adjust during render (see `components/nav-main.tsx`). The `react-hooks/set-state-in-effect` and `react-hooks/refs` rules are errors, not warnings.
- Don't read or write refs during render.

## TypeScript

- Strict mode is enabled (`tsconfig.json`) — keep it that way.
- Avoid `any`; prefer explicit prop types/interfaces (see `components/production-calculators.tsx` for the pattern of typed helper functions like `useNumberField`).
- `resolveJsonModule` is on — importing `app/data.json` directly is expected (see `app/page.tsx`).

## Next.js

- Default to server components; add `"use client"` only when the component needs state, effects, or browser APIs (theming, calculators, sidebar interactivity all use it today).
- App Router routes live under `app/`; there are no API routes yet — if adding one, keep it focused on a single responsibility and validate input before use.

## Styling

- Use the Tailwind/shadcn CSS variable tokens defined in `app/globals.css` (`--background`, `--foreground`, `--primary`, `--muted`, `--chart-1..5`, etc.) — no hardcoded hex values.
- Class names are sorted automatically by `prettier-plugin-tailwindcss` on `npm run format`; run it before committing.
- Border radius scale comes from `--radius` and its derived `--radius-sm/md/lg/xl/2xl/3xl/4xl` tokens (see `app/globals.css`).

## Formatting

- Prettier config (`.prettierrc`): no semicolons, double quotes, 2-space tabs, `es5` trailing commas, 80-char print width. Run `npm run format` rather than hand-formatting.
- Run `npm run lint` (ESLint flat config, `eslint-config-next`) and `npm run typecheck` before considering a change done.

## File Organization

- `app/` — routes only (no shared components living directly in `app/`, aside from route-local files like `app/data.json`)
- `components/` — feature/composite dashboard components and the 7QC tools
- `components/six-sigma/` — the DMAIC tool cards, plus `shared.tsx` for helpers they have in common
- `components/calculator-primitives.tsx` — `Field`, `Result`, `TextField`, `ToolLink`, `SendButton`, `fmt` and the number-field hooks. Import inputs and result tiles from here, never re-declare them.
- `components/ui/` — shadcn/ui primitives, added via `npx shadcn@latest add <name>`
- `lib/six-sigma/` — `stats.ts` (pure math), `constants.ts` (reference tables), `project-store.ts` (shared state)
- `lib/` — shared utilities
- `hooks/` — shared React hooks
- `scripts/` — `verify-stats.ts` and its runner; not part of the app bundle

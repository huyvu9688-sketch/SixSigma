# UI Context

## Theme

Light and dark mode, switchable at runtime via `next-themes` (`ThemeProvider` in `app/layout.tsx`, toggle in `components/theme-toggle.tsx`). Base palette is a neutral stone/warm-gray tone (`baseColor: "stone"` in `components.json`), using OKLCH color values. Not dark-only.

## Colors

All tokens are CSS custom properties defined in `app/globals.css` under `:root` (light) and `.dark` (dark override), then re-exposed as Tailwind colors via the `@theme inline` block. Never hardcode hex values — use the Tailwind classes below (which map to the tokens).

| Role            | CSS Variable        | Tailwind class            |
| ---------------- | -------------------- | -------------------------- |
| Page background   | `--background`        | `bg-background`             |
| Primary text       | `--foreground`        | `text-foreground`           |
| Card surface       | `--card`               | `bg-card`                    |
| Popover surface    | `--popover`            | `bg-popover`                 |
| Primary accent     | `--primary`            | `bg-primary` / `text-primary`|
| Secondary          | `--secondary`          | `bg-secondary`               |
| Muted              | `--muted`              | `bg-muted` / `text-muted-foreground` |
| Accent (hover/highlight) | `--accent`      | `bg-accent`                  |
| Destructive/error  | `--destructive`        | `text-destructive` / `bg-destructive` |
| Border             | `--border`             | `border-border` (applied globally via `@layer base`) |
| Chart series 1-5   | `--chart-1` … `--chart-5` | `bg-chart-1` etc.         |
| Sidebar surface    | `--sidebar` + `--sidebar-*` | see `components/ui/sidebar.tsx` |

Result "tone" states live in `toneClass()` in `components/calculator-primitives.tsx` and use paired Tailwind color utilities rather than tokens, because there is no semantic success/warning token in the stone palette: `text-green-600 dark:text-green-400` (good), `text-yellow-600 dark:text-yellow-400` (warn), `text-destructive` (bad), `text-foreground` (default). Use the `Result` component rather than restating these classes.

Tone is a judgement, so only apply it where there is a benchmark to judge against (Cpk ≥ 1.33, OEE ≥ 85%, p-value vs. alpha). A figure with no threshold stays `default`, and a figure that cannot be computed renders `"—"` with `default` tone rather than a green zero.

## Typography

| Role      | Font        | Variable      |
| --------- | ----------- | ------------- |
| UI text   | Roboto      | `--font-sans` |
| Code/mono | Geist Mono  | `--font-mono` |

Both loaded via `next/font/google` in `app/layout.tsx`.

## Border Radius

Base `--radius: 0.625rem`, with derived scale in `app/globals.css`:

| Context                    | Class          |
| --------------------------- | --------------- |
| Small/inline UI              | `rounded-sm` (`--radius-sm`, 0.6×) |
| Default (cards, inputs)      | `rounded-lg` (`--radius-lg`, 1×)   |
| Larger panels                 | `rounded-xl` / `rounded-2xl` (1.4×/1.8×) |
| Large modals/overlays         | `rounded-3xl` / `rounded-4xl` (2.2×/2.6×) |

## Spacing (4pt Grid)

Every padding, margin, gap, and sizing value must be a multiple of 4px. Tailwind's default spacing scale already maps to this (`1` = 4px, `2` = 8px, `4` = 16px, `6` = 24px, `8` = 32px, …) — use scale classes (`p-4`, `gap-6`, `h-180`) rather than arbitrary values (`p-[15px]`, `h-[720px]`). This keeps padding, margins, line-height, and component sizing visually aligned across the app without hand-tuning each one. Prefer generous spacing over cramped layouts — err toward the next step up the scale, not down.

## Component Library

shadcn/ui (`base-nova` style, see `components.json`) on top of Tailwind CSS v4. Primitives live in `components/ui/`. Add new ones with `npx shadcn@latest add <component>` rather than writing from scratch; import via `@/components/ui/<name>`. Reference/QA page for available primitives: `app/showcase/page.tsx`.

## Layout Patterns

- **App shell**: `SidebarProvider` + `AppSidebar` (`variant="inset"`) + `SidebarInset`, with `SiteHeader` on top and page content below (see `app/page.tsx`).
- **Sidebar**: collapsible (`collapsible="offcanvas"`), width set via `--sidebar-width` CSS var; grouped nav sections (`NavMain`, `NavDocuments`, `NavSecondary` pinned to bottom via `mt-auto`).
- **Dashboard content**: vertical stack of sections with consistent `px-4 lg:px-6` horizontal padding and `gap-4`/`gap-6` vertical rhythm, wrapped in a `@container/main` for container queries.
- **Cards**: `Card`/`CardHeader`/`CardContent` from `components/ui/card.tsx` used throughout (`SectionCards`, calculator results).
- **Tools and calculators**: each tool is its own route, reached via the DMAIC-grouped sidebar sub-nav, not a tab strip. A route file is a server component rendering `AppShell` plus one client component wrapped in `<div className="px-4 lg:px-6">`.
- **Standard tool layout**: `grid gap-4 lg:grid-cols-3` with an inputs card at `lg:col-span-1` on the left and a results/chart card at `lg:col-span-2` on the right. Cards that own a wide table span all three (`lg:col-span-3`). This is the pattern for every Six Sigma tool; the bento grids below are reserved for the two calculators that were built that way.
- **Card anatomy**: `CardTitle` carries a Lucide icon at `size-4`; `CardDescription` states the current finding in a sentence (what the numbers mean right now), not a static definition. The formula goes in a `SectionNote` at the bottom of the card, and a `FlowFooter` (`components/six-sigma/shared.tsx`) below that holds `ToolLink`/`SendButton` controls pointing at the next tool.
- **Editable lists and grids**: use `EditableTextList` for add/remove text rows and `CellInput` inside `Table` for grid-shaped tools (FMEA, control plan, CTQ tree). Wide tables set a `min-w-*` and rely on `Table`'s own `overflow-x-auto` container.
- **Simple calculators** are a single `Card` with a two-column grid — inputs (`Field`) on one side, computed `Result` tiles on the other. Calculators with a visualization may use the **bento grid** pattern below instead.
- **Bento grid** (calculator pages with a chart): a 3-column × 3-row CSS grid (`grid lg:grid-cols-3 lg:grid-rows-3`, fixed height on `lg:` (`lg:h-180`), stacks to a single column below it) of separate `Card`s, each sized by `col-span`/`row-span`. Shared calculation state lives in a `use<Name>Calculator()` hook so the cards can be split into components without prop-drilling raw fields. Two layouts in use:
  - **Left-rail** (OEE — `components/production-calculators.tsx`): inputs card `col-span-1 row-span-3` (full-height, narrow, left column); chart card `col-span-2 row-span-2` (top right, `recharts` via `components/ui/chart.tsx`, series colored with `--chart-1`…`--chart-5`), `CardTitle` only, no `CardDescription`; result card `col-span-2 row-span-1` (bottom right, compact `Result` tiles + a one-line takeaway in `CardDescription`).
  - **Top-split** (Takt Time & Line Balance — `components/production-calculators.tsx`): a narrow inputs card `col-span-1 row-span-1` (top-left) and a wider result card `col-span-2 row-span-1` (top-right) share row 1; a single full-width card `col-span-3 row-span-2` fills rows 2–3, combining a compact editor (dynamic add/remove rows) with its chart in one `CardContent` when the visualization depends on user-managed list data rather than fixed fields.
  Inputs cards use a plain heading ("Input params" style) — no calculator-name title/subtitle pair; keep it to one heading.

## Icons

Lucide React (`lucide-react`), stroke-based icons only — used throughout nav (`LayoutDashboardIcon`, `FactoryIcon`, etc.) and calculators (`GaugeIcon`, `TimerIcon`, `ScaleIcon`).

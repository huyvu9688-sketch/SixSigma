"use client"

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Result,
  SectionNote,
  SendButton,
  ToolLink,
  fmt,
} from "@/components/calculator-primitives"
import { FlowFooter } from "@/components/six-sigma/shared"
import { pareto, toNonNegative } from "@/lib/six-sigma/stats"
import {
  newId,
  useSixSigmaProject,
  type DefectCategory,
  type Project,
} from "@/lib/six-sigma/project-store"
import { PlusIcon, XIcon, BarChart3Icon } from "lucide-react"

const chartConfig = {
  count: { label: "Defects", color: "var(--chart-1)" },
  cumulativePct: { label: "Cumulative %", color: "var(--chart-4)" },
} satisfies ChartConfig

export function ParetoAnalysisCard() {
  const [project, update] = useSixSigmaProject()
  const rows = project.defectCategories
  const setRows = (next: DefectCategory[]) =>
    update((p: Project) => ({ ...p, defectCategories: next }))
  const patch = (id: string, changes: Partial<DefectCategory>) =>
    setRows(rows.map((r) => (r.id === id ? { ...r, ...changes } : r)))

  const {
    rows: ranked,
    total,
    vitalFewCount,
  } = pareto(
    rows.map((r) => ({
      name: r.name.trim() || "Untitled",
      count: toNonNegative(r.count),
    }))
  )
  const vitalFewShare =
    ranked.length > 0 ? (vitalFewCount / ranked.length) * 100 : 0
  const vitalFewDefects = ranked
    .slice(0, vitalFewCount)
    .reduce((a, r) => a + r.count, 0)
  const vitalFewPct = total > 0 ? (vitalFewDefects / total) * 100 : 0
  const topCategory = ranked[0]

  const alreadyTheEffect =
    topCategory != null &&
    project.fishbone.effect.trim().toLowerCase() ===
      topCategory.name.trim().toLowerCase()

  const sendToFishbone = () => {
    if (!topCategory) return
    update((p) => ({
      ...p,
      fishbone: { ...p.fishbone, effect: topCategory.name },
      fiveWhys: {
        ...p.fiveWhys,
        problem: `${topCategory.name} accounts for ${topCategory.pct.toFixed(0)}% of defects`,
      },
    }))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="@container/card lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3Icon className="size-4" />
            Defect Categories
          </CardTitle>
          <CardDescription>
            Counts by category for the period you are studying. Shared with the
            check sheet and the project hub.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={r.id} className="flex items-center gap-1.5">
              <Input
                aria-label={`Category ${i + 1} name`}
                placeholder="Category"
                value={r.name}
                onChange={(e) => patch(r.id, { name: e.target.value })}
                className="h-8 flex-1 text-sm"
              />
              <Input
                aria-label={`Category ${i + 1} defect count`}
                inputMode="numeric"
                value={r.count}
                onChange={(e) => patch(r.id, { count: e.target.value })}
                className="h-8 w-20 text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() => setRows(rows.filter((x) => x.id !== r.id))}
              >
                <XIcon className="size-3" />
                <span className="sr-only">Remove category</span>
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-fit gap-1 text-xs"
            onClick={() =>
              setRows([...rows, { id: newId("dc"), name: "", count: "0" }])
            }
          >
            <PlusIcon className="size-3" />
            Category
          </Button>
          <SectionNote className="mt-2">
            Categories with a count of zero are left off the chart. A category
            called &quot;other&quot; that ends up first means the categories
            need splitting.
          </SectionNote>
        </CardContent>
      </Card>

      <Card className="@container/card lg:col-span-2">
        <CardHeader>
          <CardTitle>Pareto Chart</CardTitle>
          <CardDescription>
            {ranked.length > 0
              ? `${vitalFewCount} of ${ranked.length} categories (${vitalFewShare.toFixed(0)}% of them) account for ${vitalFewPct.toFixed(0)}% of ${fmt.num(total)} defects. Those are the vital few; fixing anything else first spends effort on the trivial many.`
              : "Add categories with counts above zero to rank them."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <ComposedChart data={ranked} margin={{ top: 8, right: 24 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fontSize: 11 }}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                yAxisId="count"
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ReferenceLine
                yAxisId="pct"
                y={80}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                label={{
                  value: "80%",
                  position: "insideTopRight",
                  fontSize: 11,
                }}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar
                yAxisId="count"
                dataKey="count"
                name="Defects"
                radius={4}
                barSize={32}
              >
                {ranked.map((r, i) => (
                  <Cell
                    key={r.name}
                    // The vital few are filled solid; the trivial many are muted
                    // so the split is visible without reading the cumulative line.
                    fill={i < vitalFewCount ? "var(--chart-1)" : "var(--muted)"}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="pct"
                dataKey="cumulativePct"
                name="Cumulative %"
                type="monotone"
                stroke="var(--color-cumulativePct)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ChartContainer>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Result label="Total defects" value={fmt.num(total)} />
            <Result
              label="Top category"
              value={topCategory?.name ?? "—"}
              tone={topCategory ? "bad" : "default"}
              hint={
                topCategory
                  ? `${topCategory.pct.toFixed(1)}% of all defects`
                  : undefined
              }
            />
            <Result
              label="Vital few"
              value={
                ranked.length > 0 ? `${vitalFewCount} of ${ranked.length}` : "—"
              }
              tone={ranked.length > 0 ? "warn" : "default"}
              hint="to reach 80%"
            />
            <Result
              label="Covered by vital few"
              value={ranked.length > 0 ? `${vitalFewPct.toFixed(1)}%` : "—"}
            />
          </div>
          <FlowFooter>
            {topCategory && !alreadyTheEffect ? (
              <SendButton onClick={sendToFishbone}>
                Investigate &ldquo;{topCategory.name}&rdquo;
              </SendButton>
            ) : null}
            <ToolLink href="/calculators/root-cause">
              5 Whys &amp; fishbone
            </ToolLink>
            <ToolLink href="/qc-tools/check-sheet">Check sheet</ToolLink>
            <ToolLink href="/six-sigma/fmea">FMEA</ToolLink>
          </FlowFooter>
          <SectionNote>
            The vital few are the categories needed to reach 80% of the total,
            including the one that crosses the line. The Pareto principle is a
            rule of thumb, not a law: if the curve is flat, no small set of
            categories dominates and the problem needs a different cut of the
            data.
          </SectionNote>
        </CardContent>
      </Card>
    </div>
  )
}

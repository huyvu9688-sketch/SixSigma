"use client"

import * as React from "react"
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
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
  TextField,
  ToolLink,
  type Tone,
} from "@/components/calculator-primitives"
import { FlowFooter } from "@/components/six-sigma/shared"
import { linearRegression } from "@/lib/six-sigma/stats"
import { newId } from "@/lib/six-sigma/project-store"
import { PlusIcon, XIcon, ScatterChartIcon } from "lucide-react"

type Point = { id: string; x: string; y: string }

// Sanding pressure vs. scratch count: the kind of pair a finishing line would
// actually test during Analyze.
const SEED_POINTS: [number, number][] = [
  [10, 2],
  [12, 3],
  [14, 3],
  [15, 4],
  [18, 5],
  [20, 6],
  [22, 6],
  [24, 8],
  [26, 9],
  [28, 11],
]

const chartConfig = {
  points: { label: "Observations", color: "var(--chart-1)" },
  trend: { label: "Best fit", color: "var(--chart-4)" },
} satisfies ChartConfig

export function ScatterDiagramTool() {
  const [xLabel, setXLabel] = React.useState("Sanding pressure (N)")
  const [yLabel, setYLabel] = React.useState("Scratches per frame")
  const [points, setPoints] = React.useState<Point[]>(() =>
    SEED_POINTS.map(([x, y], i) => ({
      id: `point-${i + 1}`,
      x: String(x),
      y: String(y),
    }))
  )

  const addPoint = () =>
    setPoints((prev) => [...prev, { id: newId("point"), x: "", y: "" }])
  const removePoint = (id: string) =>
    setPoints((prev) => prev.filter((p) => p.id !== id))
  const patch = (id: string, changes: Partial<Point>) =>
    setPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p))
    )

  // Only complete pairs are analysed or plotted. Treating a blank cell as zero
  // would drag the correlation toward the origin and invent a relationship.
  const parsed = points
    .map((p) => ({ x: Number(p.x), y: Number(p.y) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  const incomplete = points.length - parsed.length

  const { n, r, r2, slope, intercept } = linearRegression(parsed)

  const xs = parsed.map((p) => p.x)
  const minX = xs.length > 0 ? Math.min(...xs) : 0
  const maxX = xs.length > 0 ? Math.max(...xs) : 0
  const trendLine =
    n > 1 && minX !== maxX
      ? [
          { x: minX, y: slope * minX + intercept },
          { x: maxX, y: slope * maxX + intercept },
        ]
      : []

  const abs = Math.abs(r)
  const strength = abs >= 0.7 ? "strong" : abs >= 0.3 ? "moderate" : "weak"
  const direction = r > 0 ? "positive" : r < 0 ? "negative" : "no"
  const tone: Tone =
    n < 3 ? "default" : abs >= 0.7 ? "good" : abs >= 0.3 ? "warn" : "bad"

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="@container/card lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScatterChartIcon className="size-4" />
            Paired Observations
          </CardTitle>
          <CardDescription>
            Each row is one observation measured on both variables at the same
            time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <TextField
            id="scatter-x-label"
            label="X variable"
            value={xLabel}
            onChange={setXLabel}
          />
          <TextField
            id="scatter-y-label"
            label="Y variable"
            value={yLabel}
            onChange={setYLabel}
          />
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 text-xs text-muted-foreground">
              <span>X</span>
              <span>Y</span>
              <span />
            </div>
            {points.map((p, i) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_1fr_auto] items-center gap-1.5"
              >
                <Input
                  aria-label={`Observation ${i + 1} X value`}
                  inputMode="decimal"
                  value={p.x}
                  onChange={(e) => patch(p.id, { x: e.target.value })}
                  className="h-8 text-sm"
                />
                <Input
                  aria-label={`Observation ${i + 1} Y value`}
                  inputMode="decimal"
                  value={p.y}
                  onChange={(e) => patch(p.id, { y: e.target.value })}
                  className="h-8 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => removePoint(p.id)}
                >
                  <XIcon className="size-3" />
                  <span className="sr-only">Remove observation</span>
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-fit gap-1 text-xs"
              onClick={addPoint}
            >
              <PlusIcon className="size-3" />
              Point
            </Button>
          </div>
          {incomplete > 0 ? (
            <SectionNote>
              {incomplete} row{incomplete === 1 ? "" : "s"} with a missing value{" "}
              {incomplete === 1 ? "is" : "are"} excluded from the analysis.
            </SectionNote>
          ) : null}
        </CardContent>
      </Card>

      <Card className="@container/card lg:col-span-2">
        <CardHeader>
          <CardTitle>Scatter Diagram</CardTitle>
          <CardDescription>
            {n < 3
              ? "Enter at least three complete pairs."
              : `r = ${r.toFixed(2)}: a ${strength} ${direction} relationship. The fitted line explains ${(r2 * 100).toFixed(0)}% of the variation in ${yLabel.toLowerCase()}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <ComposedChart margin={{ top: 8, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid />
              <XAxis
                dataKey="x"
                type="number"
                name={xLabel}
                domain={["dataMin", "dataMax"]}
                tickLine={false}
                axisLine={false}
                label={{
                  value: xLabel,
                  position: "insideBottom",
                  offset: -12,
                  fontSize: 11,
                }}
              />
              <YAxis
                dataKey="y"
                type="number"
                name={yLabel}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <ZAxis range={[60, 60]} />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={<ChartTooltipContent />}
              />
              <Scatter
                name="Observations"
                data={parsed}
                fill="var(--color-points)"
              />
              {trendLine.length > 0 ? (
                <Line
                  type="linear"
                  dataKey="y"
                  name="Best fit"
                  data={trendLine}
                  stroke="var(--color-trend)"
                  strokeWidth={2}
                  dot={false}
                  legendType="none"
                  isAnimationActive={false}
                />
              ) : null}
            </ComposedChart>
          </ChartContainer>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Result label="n" value={String(n)} />
            <Result
              label="Correlation (r)"
              value={n > 1 ? r.toFixed(3) : "—"}
              tone={tone}
            />
            <Result
              label="r² (variation explained)"
              value={n > 1 ? `${(r2 * 100).toFixed(1)}%` : "—"}
            />
            <Result
              label="Best fit line"
              value={
                n > 1 && trendLine.length > 0
                  ? `y = ${slope.toFixed(3)}x ${intercept >= 0 ? "+" : "−"} ${Math.abs(intercept).toFixed(2)}`
                  : "—"
              }
            />
          </div>
          <SectionNote>
            Correlation is not causation. A strong r means the two move
            together, which could be because X drives Y, Y drives X, or a third
            variable drives both. Confirm the mechanism before acting, and check
            the plot for a curve or a cluster that a single r value would hide.
          </SectionNote>
          <FlowFooter>
            <ToolLink href="/six-sigma/hypothesis-test">
              Test the difference statistically
            </ToolLink>
            <ToolLink href="/calculators/root-cause">
              Root cause analysis
            </ToolLink>
          </FlowFooter>
        </CardContent>
      </Card>
    </div>
  )
}

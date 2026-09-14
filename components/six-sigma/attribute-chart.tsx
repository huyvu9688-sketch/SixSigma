"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Result,
  SectionNote,
  ToolLink,
  type Tone,
} from "@/components/calculator-primitives"
import { CellInput, FlowFooter } from "@/components/six-sigma/shared"
import {
  cChart,
  npChart,
  nelsonTests,
  pChart,
  toNonNegative,
  uChart,
  NELSON_TEST_DESCRIPTIONS,
  type AttributeRow,
} from "@/lib/six-sigma/stats"
import { newId } from "@/lib/six-sigma/project-store"
import { PlusIcon, XIcon, ActivitySquareIcon } from "lucide-react"

type ChartKind = "p" | "np" | "c" | "u"

type Row = { id: string; label: string; n: string; d: string }

const KINDS: {
  value: ChartKind
  label: string
  plots: string
  when: string
  needsConstantN: boolean
}[] = [
  {
    value: "p",
    label: "p chart — proportion defective",
    plots: "Share of units that failed, as a fraction",
    when: "Pass/fail data where the sample size changes between checks",
    needsConstantN: false,
  },
  {
    value: "np",
    label: "np chart — count defective",
    plots: "Number of failed units per sample",
    when: "Pass/fail data with the same sample size every time",
    needsConstantN: true,
  },
  {
    value: "c",
    label: "c chart — defect count",
    plots: "Number of defects per sample",
    when: "Several defects possible per unit, constant sample size",
    needsConstantN: true,
  },
  {
    value: "u",
    label: "u chart — defects per unit",
    plots: "Defects divided by units inspected",
    when: "Several defects possible per unit, sample size changes",
    needsConstantN: false,
  },
]

// Guide example, p-chart chapter: 20 daily samples of 100 business cards.
const SEED_DEFECTS = [
  5, 2, 1, 0, 0, 2, 1, 0, 6, 0, 7, 0, 9, 0, 0, 1, 2, 0, 7, 0,
]

const chartConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
  ucl: { label: "UCL", color: "var(--destructive)" },
  lcl: { label: "LCL", color: "var(--destructive)" },
  center: { label: "Center", color: "var(--muted-foreground)" },
} satisfies ChartConfig

function Dot(props: {
  cx?: number
  cy?: number
  payload?: { violation?: boolean }
}) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null) return null
  const bad = payload?.violation
  return (
    <circle
      cx={cx}
      cy={cy}
      r={bad ? 4.5 : 3}
      fill={bad ? "var(--destructive)" : "var(--color-value)"}
    />
  )
}

export function AttributeChartTool() {
  const [kind, setKind] = React.useState<ChartKind>("p")
  const [rows, setRows] = React.useState<Row[]>(() =>
    SEED_DEFECTS.map((d, i) => ({
      id: `attr-${i + 1}`,
      label: `Day ${i + 1}`,
      n: "100",
      d: String(d),
    }))
  )

  const patch = (id: string, changes: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)))

  const parsed: AttributeRow[] = rows.map((r) => ({
    n: toNonNegative(r.n),
    d: toNonNegative(r.d),
  }))

  const result = React.useMemo(() => {
    switch (kind) {
      case "p":
        return pChart(parsed)
      case "np":
        return npChart(parsed)
      case "c":
        return cChart(parsed)
      case "u":
        return uChart(parsed)
    }
    // The switch is exhaustive over ChartKind.
  }, [kind, parsed])

  const spec = KINDS.find((k) => k.value === kind)!
  const constantN = parsed.every((r) => r.n === parsed[0]?.n)
  const isProportion = kind === "p" || kind === "u"

  // Standardizing each point by its own limits lets the pattern tests work even
  // when the subgroup sizes differ and the limits step up and down.
  const zValues = result.points.map((pt) => {
    const halfWidth = (pt.ucl - result.center) / 3
    return halfWidth > 0 ? (pt.value - result.center) / halfWidth : 0
  })
  // The guide notes fewer special-cause tests apply to attribute data, so only
  // the four that do not depend on a normal spread are run here.
  const failures = nelsonTests(zValues, 0, 1).filter((f) => f.test <= 4)
  const violationIndexes = new Set(failures.map((f) => f.index))

  const chartData = rows.map((r, i) => ({
    label: r.label || `#${i + 1}`,
    value: result.points[i]?.value ?? 0,
    ucl: result.points[i]?.ucl ?? 0,
    lcl: result.points[i]?.lcl ?? 0,
    center: result.center,
    violation: violationIndexes.has(i),
  }))

  const tone: Tone =
    failures.length === 0 ? "good" : failures.length <= 2 ? "warn" : "bad"

  const format = (v: number) => (isProportion ? v.toFixed(4) : v.toFixed(2))

  const byTest = new Map<number, number[]>()
  for (const f of failures) {
    byTest.set(f.test, [...(byTest.get(f.test) ?? []), f.index + 1])
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="@container/card lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivitySquareIcon className="size-4" />
            Counts
          </CardTitle>
          <CardDescription>
            Units inspected and defects (or defective units) found, in the order
            collected.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attr-kind">Chart type</Label>
            <NativeSelect
              id="attr-kind"
              className="w-full"
              value={kind}
              onChange={(e) => setKind(e.target.value as ChartKind)}
            >
              {KINDS.map((k) => (
                <NativeSelectOption key={k.value} value={k.value}>
                  {k.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <SectionNote>{spec.when}</SectionNote>
          </div>
          {spec.needsConstantN && !constantN ? (
            <p className="text-xs text-destructive">
              A {kind} chart needs the same sample size in every row. Your sizes
              vary, so switch to a {kind === "np" ? "p" : "u"} chart, which
              handles unequal sizes.
            </p>
          ) : null}
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs text-muted-foreground">
                  <TableHead className="min-w-20">Sample</TableHead>
                  <TableHead className="w-20">Units</TableHead>
                  <TableHead className="w-20">Defects</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <CellInput
                        label={`Sample ${i + 1} label`}
                        value={r.label}
                        onChange={(label) => patch(r.id, { label })}
                      />
                    </TableCell>
                    <TableCell>
                      <CellInput
                        label={`Sample ${i + 1} units inspected`}
                        value={r.n}
                        inputMode="numeric"
                        onChange={(n) => patch(r.id, { n })}
                      />
                    </TableCell>
                    <TableCell>
                      <CellInput
                        label={`Sample ${i + 1} defects`}
                        value={r.d}
                        inputMode="numeric"
                        onChange={(d) => patch(r.id, { d })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          setRows((prev) => prev.filter((x) => x.id !== r.id))
                        }
                      >
                        <XIcon className="size-3" />
                        <span className="sr-only">Remove sample</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-fit gap-1 text-xs"
            onClick={() =>
              setRows((prev) => [
                ...prev,
                {
                  id: newId("attr"),
                  label: `Sample ${prev.length + 1}`,
                  n: prev[prev.length - 1]?.n ?? "100",
                  d: "0",
                },
              ])
            }
          >
            <PlusIcon className="size-3" />
            Sample
          </Button>
        </CardContent>
      </Card>

      <Card className="@container/card lg:col-span-2">
        <CardHeader>
          <CardTitle>{spec.label}</CardTitle>
          <CardDescription>
            {spec.plots}.{" "}
            {failures.length === 0
              ? "No special-cause signals: the process is in statistical control."
              : `${failures.length} signal${failures.length === 1 ? "" : "s"} of special cause. Investigate before changing anything.`}
            {!constantN && !isProportion
              ? " Limits step with each sample size."
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <LineChart data={chartData} margin={{ top: 8, right: 24 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(v) => format(Number(v))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => format(Number(value))}
                  />
                }
              />
              <Line
                dataKey="center"
                name="Center"
                stroke="var(--color-center)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="ucl"
                name="UCL"
                stroke="var(--color-ucl)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                type="stepAfter"
                isAnimationActive={false}
              />
              <Line
                dataKey="lcl"
                name="LCL"
                stroke="var(--color-lcl)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                type="stepAfter"
                isAnimationActive={false}
              />
              <Line
                dataKey="value"
                name="Value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={<Dot />}
              />
            </LineChart>
          </ChartContainer>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Result
              label={
                kind === "p"
                  ? "p̄ (center)"
                  : kind === "np"
                    ? "n p̄ (center)"
                    : kind === "c"
                      ? "c̄ (center)"
                      : "ū (center)"
              }
              value={format(result.center)}
            />
            <Result
              label="UCL (first sample)"
              value={result.points[0] ? format(result.points[0].ucl) : "—"}
            />
            <Result
              label="LCL (first sample)"
              value={result.points[0] ? format(result.points[0].lcl) : "—"}
            />
            <Result
              label="Signals"
              value={String(failures.length)}
              tone={tone}
            />
          </div>
          {byTest.size > 0 ? (
            <div className="flex flex-col gap-1.5">
              {[...byTest.entries()]
                .sort((a, b) => a[0] - b[0])
                .map(([test, points]) => (
                  <p key={test} className="text-xs text-destructive">
                    Test {test}:{" "}
                    {
                      NELSON_TEST_DESCRIPTIONS[
                        test as keyof typeof NELSON_TEST_DESCRIPTIONS
                      ]
                    }{" "}
                    — at sample{points.length > 1 ? "s" : ""}{" "}
                    {points.join(", ")}
                  </p>
                ))}
            </div>
          ) : null}
          <SectionNote>
            p chart: p̄ ± 3√(p̄(1−p̄)/nᵢ). np chart: np̄ ± 3√(np̄(1−p̄)). c chart: c̄ ±
            3√c̄. u chart: ū ± 3√(ū/nᵢ). A negative lower limit is clipped to
            zero because a count cannot be negative. An in-control chart can
            still sit at an unacceptable level: control asks whether the process
            is stable, capability asks whether stable is good enough.
          </SectionNote>
          <FlowFooter>
            <ToolLink href="/qc-tools/control-chart">
              Measured data instead
            </ToolLink>
            <ToolLink href="/six-sigma/control-plan">Control plan</ToolLink>
          </FlowFooter>
        </CardContent>
      </Card>
    </div>
  )
}

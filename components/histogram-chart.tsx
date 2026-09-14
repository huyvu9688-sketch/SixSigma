"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Field,
  Result,
  SectionNote,
  ToolLink,
} from "@/components/calculator-primitives"
import { FlowFooter } from "@/components/six-sigma/shared"
import {
  histogram,
  mean as meanOf,
  median as medianOf,
  parseNumberList,
  stdDev,
  sturgesBins,
  toNumber,
} from "@/lib/six-sigma/stats"
import { useSixSigmaProject, type Project } from "@/lib/six-sigma/project-store"
import { BarChartBigIcon } from "lucide-react"

const chartConfig = {
  count: { label: "Frequency", color: "var(--chart-1)" },
} satisfies ChartConfig

const BIN_CHOICES = [0, 5, 6, 7, 8, 9, 10, 12, 15, 20]

export function HistogramTool() {
  const [project, update] = useSixSigmaProject()
  const [binChoice, setBinChoice] = React.useState(0)

  const values = parseNumberList(project.measurementsRaw)
  const n = values.length
  const mean = meanOf(values)
  const median = medianOf(values)
  const sd = stdDev(values)
  const min = n > 0 ? Math.min(...values) : 0
  const max = n > 0 ? Math.max(...values) : 0

  const autoBins = sturgesBins(n)
  const bins = binChoice > 0 ? binChoice : autoBins
  const frequency = histogram(values, bins)

  const usl = toNumber(project.spec.usl)
  const lsl = toNumber(project.spec.lsl)
  const hasUsl = project.spec.usl.trim() !== ""
  const hasLsl = project.spec.lsl.trim() !== ""

  const outOfSpec = values.filter(
    (v) => (hasUsl && v > usl) || (hasLsl && v < lsl)
  ).length

  // Skew tells you which tail is long, which points at a different cause than
  // a symmetric spread does.
  const skew =
    n > 2 && sd > 0
      ? (values.reduce((a, v) => a + ((v - mean) / sd) ** 3, 0) * n) /
        ((n - 1) * (n - 2))
      : 0
  const shape =
    Math.abs(skew) < 0.5
      ? "roughly symmetric"
      : skew > 0
        ? "skewed toward high values"
        : "skewed toward low values"

  const chartData = frequency.map((b) => ({
    bin: `${b.lo.toFixed(2)}–${b.hi.toFixed(2)}`,
    midpoint: Number(b.midpoint.toFixed(4)),
    count: b.count,
    outside: (hasUsl && b.midpoint > usl) || (hasLsl && b.midpoint < lsl),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="@container/card lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartBigIcon className="size-4" />
            Data Set
          </CardTitle>
          <CardDescription>
            Shared with the capability and control chart tools, so the same
            numbers drive all three.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="histogram-data">
              Measurements ({project.spec.unit || "units"})
            </Label>
            <Textarea
              id="histogram-data"
              value={project.measurementsRaw}
              onChange={(e) =>
                update((p: Project) => ({
                  ...p,
                  measurementsRaw: e.target.value,
                }))
              }
              rows={8}
            />
            <SectionNote>Commas, spaces, or new lines. n = {n}.</SectionNote>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="histogram-bins">Number of bins</Label>
            <NativeSelect
              id="histogram-bins"
              className="w-full"
              value={String(binChoice)}
              onChange={(e) => setBinChoice(Number(e.target.value))}
            >
              {BIN_CHOICES.map((b) => (
                <NativeSelectOption key={b} value={String(b)}>
                  {b === 0 ? `Automatic (${autoBins}, Sturges' rule)` : b}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <SectionNote>
              Too few bins hides a second peak; too many turns the shape into
              noise. Try a couple of settings before drawing a conclusion.
            </SectionNote>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="histogram-lsl"
              label="Lower spec (LSL)"
              raw={project.spec.lsl}
              setRaw={(lslRaw) =>
                update((p) => ({ ...p, spec: { ...p.spec, lsl: lslRaw } }))
              }
            />
            <Field
              id="histogram-usl"
              label="Upper spec (USL)"
              raw={project.spec.usl}
              setRaw={(uslRaw) =>
                update((p) => ({ ...p, spec: { ...p.spec, usl: uslRaw } }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="@container/card lg:col-span-2">
        <CardHeader>
          <CardTitle>Distribution</CardTitle>
          <CardDescription>
            {n > 0
              ? `n = ${n}, ${shape}. ${outOfSpec > 0 ? `${outOfSpec} measurement${outOfSpec === 1 ? "" : "s"} fall outside the spec limits.` : "Every measurement is inside the spec limits."}`
              : "Enter measurements to draw the distribution."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <BarChart data={chartData} margin={{ top: 16, right: 24 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="midpoint"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) => Number(v).toFixed(2)}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={32}
              />
              {hasUsl ? (
                <ReferenceLine
                  x={usl}
                  ifOverflow="extendDomain"
                  stroke="var(--destructive)"
                  strokeDasharray="4 4"
                  label={{ value: "USL", position: "top", fontSize: 11 }}
                />
              ) : null}
              {hasLsl ? (
                <ReferenceLine
                  x={lsl}
                  ifOverflow="extendDomain"
                  stroke="var(--destructive)"
                  strokeDasharray="4 4"
                  label={{ value: "LSL", position: "top", fontSize: 11 }}
                />
              ) : null}
              {n > 0 ? (
                <ReferenceLine
                  x={mean}
                  ifOverflow="extendDomain"
                  stroke="var(--muted-foreground)"
                  label={{ value: "Mean", position: "top", fontSize: 11 }}
                />
              ) : null}
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.bin ?? ""
                    }
                  />
                }
              />
              <Bar dataKey="count" name="Frequency" radius={2}>
                {chartData.map((d) => (
                  <Cell
                    key={d.bin}
                    fill={
                      d.outside ? "var(--destructive)" : "var(--color-count)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Result label="Mean" value={n > 0 ? mean.toFixed(3) : "—"} />
            <Result
              label="Median"
              value={n > 0 ? median.toFixed(3) : "—"}
              hint={
                n > 2 && Math.abs(mean - median) > sd * 0.2
                  ? "differs from mean: skewed"
                  : undefined
              }
            />
            <Result label="Std deviation" value={n > 1 ? sd.toFixed(3) : "—"} />
            <Result
              label="Range"
              value={n > 0 ? `${min.toFixed(2)} – ${max.toFixed(2)}` : "—"}
            />
          </div>
          <SectionNote>
            A histogram shows shape, centre and spread but throws away time
            order, so it cannot tell you whether the process is stable. Two
            peaks usually mean two processes mixed together: two machines, two
            shifts, or two operators.
          </SectionNote>
          <FlowFooter>
            <ToolLink href="/six-sigma/capability">Capability indices</ToolLink>
            <ToolLink href="/qc-tools/control-chart">
              Same data over time
            </ToolLink>
          </FlowFooter>
        </CardContent>
      </Card>
    </div>
  )
}

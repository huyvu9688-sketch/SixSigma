"use client"

import * as React from "react"
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
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
  TextField,
  ToolLink,
  fmt,
  useSignedNumberField,
  type Tone,
} from "@/components/calculator-primitives"
import { FlowFooter } from "@/components/six-sigma/shared"
import {
  capability,
  histogram,
  mean as meanOf,
  normalPdf,
  parseNumberList,
  stdDev,
  sturgesBins,
  toNumber,
} from "@/lib/six-sigma/stats"
import { useSixSigmaProject, type Project } from "@/lib/six-sigma/project-store"
import { RulerIcon, SigmaIcon } from "lucide-react"

const chartConfig = {
  count: { label: "Frequency", color: "var(--chart-1)" },
  curve: { label: "Normal fit", color: "var(--chart-4)" },
} satisfies ChartConfig

function cpkTone(cpk: number): Tone {
  // The guide: 1.33 ≈ 4σ and is the minimum most customers accept; many
  // organizations target 2.0 with 1.5 as the floor under SPC.
  return cpk >= 1.33 ? "good" : cpk >= 1.0 ? "warn" : "bad"
}

type Source = "data" | "summary"

export function CapabilityTool() {
  const [project, update] = useSixSigmaProject()
  const [source, setSource] = React.useState<Source>("data")
  const manualMean = useSignedNumberField(75)
  const manualSd = useSignedNumberField(2.5)

  const values = parseNumberList(project.measurementsRaw)
  const dataMean = meanOf(values)
  const dataSd = stdDev(values)

  const usl = toNumber(project.spec.usl)
  const lsl = toNumber(project.spec.lsl)
  const hasUsl = project.spec.usl.trim() !== ""
  const hasLsl = project.spec.lsl.trim() !== ""

  const usingData = source === "data"
  const m = usingData ? dataMean : manualMean.value
  const sd = usingData ? dataSd : Math.abs(manualSd.value)
  const n = usingData ? values.length : 0
  const enoughData = usingData ? values.length >= 2 : sd > 0

  const cap = capability({ usl, lsl, mean: m, stdDev: sd })
  const bothLimits = hasUsl && hasLsl
  // Cp and Cpk are only defined with both limits; with one limit only the
  // one-sided index applies, so report that instead of a misleading Cp.
  const oneSidedIndex =
    hasUsl && !hasLsl ? cap.cpu : hasLsl && !hasUsl ? cap.cpl : null

  const bins = sturgesBins(values.length)
  const hist = histogram(values, bins)
  const binWidth = hist.length > 1 ? hist[1].midpoint - hist[0].midpoint : 1
  const chartData = hist.map((b) => ({
    midpoint: Number(b.midpoint.toFixed(4)),
    bin: `${b.lo.toFixed(2)}–${b.hi.toFixed(2)}`,
    count: b.count,
    // Expected frequency if the data were normal with this mean and σ, scaled
    // to the same axis as the bin counts.
    curve:
      sd > 0
        ? (normalPdf((b.midpoint - m) / sd) / sd) * values.length * binWidth
        : 0,
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="@container/card lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RulerIcon className="size-4" />
            Measurements &amp; spec
          </CardTitle>
          <CardDescription>
            This data set is shared with the histogram and control chart tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cap-source">Estimate mean and σ from</Label>
            <NativeSelect
              id="cap-source"
              className="w-full"
              value={source}
              onChange={(e) => setSource(e.target.value as Source)}
            >
              <NativeSelectOption value="data">
                The measurements below
              </NativeSelectOption>
              <NativeSelectOption value="summary">
                Numbers I type in
              </NativeSelectOption>
            </NativeSelect>
          </div>
          {usingData ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cap-data">
                Measurements ({project.spec.unit || "units"})
              </Label>
              <Textarea
                id="cap-data"
                rows={7}
                value={project.measurementsRaw}
                onChange={(e) =>
                  update((p: Project) => ({
                    ...p,
                    measurementsRaw: e.target.value,
                  }))
                }
              />
              <SectionNote>
                Separate values with commas, spaces, or new lines. n = {n}.
              </SectionNote>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field
                id="cap-mean"
                label="Process mean"
                raw={manualMean.raw}
                setRaw={manualMean.setRaw}
              />
              <Field
                id="cap-sd"
                label="Std deviation (σ)"
                raw={manualSd.raw}
                setRaw={manualSd.setRaw}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="cap-lsl"
              label="Lower spec (LSL)"
              raw={project.spec.lsl}
              setRaw={(lslRaw) =>
                update((p) => ({ ...p, spec: { ...p.spec, lsl: lslRaw } }))
              }
            />
            <Field
              id="cap-usl"
              label="Upper spec (USL)"
              raw={project.spec.usl}
              setRaw={(uslRaw) =>
                update((p) => ({ ...p, spec: { ...p.spec, usl: uslRaw } }))
              }
            />
            <Field
              id="cap-target"
              label="Target"
              raw={project.spec.target}
              setRaw={(target) =>
                update((p) => ({ ...p, spec: { ...p.spec, target } }))
              }
            />
            <TextField
              id="cap-unit"
              label="Unit"
              value={project.spec.unit}
              onChange={(unit) =>
                update((p) => ({ ...p, spec: { ...p.spec, unit } }))
              }
            />
          </div>
          <SectionNote>
            Spec limits come from the customer requirement, never from the
            control chart. A process can be in control and still make parts the
            customer will reject.
          </SectionNote>
        </CardContent>
      </Card>

      <Card className="@container/card lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SigmaIcon className="size-4" />
            Process capability
          </CardTitle>
          <CardDescription>
            {enoughData && cap.hasSpread
              ? `Mean ${m.toFixed(2)} ${project.spec.unit} with σ ${sd.toFixed(3)}; the nearest spec limit is ${cap.sigmaLevel.toFixed(2)}σ away, so about ${fmt.num(cap.ppmOutside)} parts per million fall outside spec.`
              : "Enter at least two measurements (or a mean and σ) plus both spec limits."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {usingData && values.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <ComposedChart data={chartData} margin={{ top: 16, right: 24 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="midpoint"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v) => Number(v).toFixed(1)}
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
                {hasLsl ? (
                  <ReferenceLine
                    x={lsl}
                    ifOverflow="extendDomain"
                    stroke="var(--destructive)"
                    strokeDasharray="4 4"
                    label={{ value: "LSL", position: "top", fontSize: 11 }}
                  />
                ) : null}
                {hasUsl ? (
                  <ReferenceLine
                    x={usl}
                    ifOverflow="extendDomain"
                    stroke="var(--destructive)"
                    strokeDasharray="4 4"
                    label={{ value: "USL", position: "top", fontSize: 11 }}
                  />
                ) : null}
                {project.spec.target.trim() !== "" ? (
                  <ReferenceLine
                    x={toNumber(project.spec.target)}
                    ifOverflow="extendDomain"
                    stroke="var(--muted-foreground)"
                    label={{ value: "Target", position: "top", fontSize: 11 }}
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
                <Bar
                  dataKey="count"
                  name="Frequency"
                  fill="var(--color-count)"
                  radius={2}
                />
                <Area
                  dataKey="curve"
                  name="Normal fit"
                  type="monotone"
                  stroke="var(--color-curve)"
                  fill="var(--color-curve)"
                  fillOpacity={0.12}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ChartContainer>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Result
              label="Cp"
              value={
                enoughData && cap.hasSpread && bothLimits
                  ? cap.cp.toFixed(2)
                  : "—"
              }
              hint="spread only, ignores centering"
            />
            <Result
              label="Cpk"
              value={
                enoughData && cap.hasSpread && bothLimits
                  ? cap.cpk.toFixed(2)
                  : oneSidedIndex !== null && enoughData && cap.hasSpread
                    ? oneSidedIndex.toFixed(2)
                    : "—"
              }
              tone={
                enoughData && cap.hasSpread
                  ? cpkTone(bothLimits ? cap.cpk : (oneSidedIndex ?? 0))
                  : "default"
              }
              hint={bothLimits ? "target ≥ 1.33" : "one-sided index"}
            />
            <Result
              label="Sigma level"
              value={
                enoughData && cap.hasSpread
                  ? `${cap.sigmaLevel.toFixed(2)}σ`
                  : "—"
              }
              hint="to the nearest spec limit"
            />
            <Result
              label="Out of spec"
              value={
                enoughData && cap.hasSpread
                  ? `${fmt.num(cap.ppmOutside)} ppm`
                  : "—"
              }
              tone={
                enoughData && cap.hasSpread
                  ? cap.ppmOutside > 6210
                    ? "bad"
                    : cap.ppmOutside > 233
                      ? "warn"
                      : "good"
                  : "default"
              }
            />
            <Result
              label="Cpu (upper)"
              value={
                enoughData && hasUsl && cap.hasSpread ? cap.cpu.toFixed(2) : "—"
              }
            />
            <Result
              label="Cpl (lower)"
              value={
                enoughData && hasLsl && cap.hasSpread ? cap.cpl.toFixed(2) : "—"
              }
            />
            <Result
              label="Mean"
              value={enoughData ? m.toFixed(3) : "—"}
              hint={project.spec.unit}
            />
            <Result
              label="σ"
              value={enoughData ? sd.toFixed(3) : "—"}
              hint={usingData ? `from n = ${n}` : "entered"}
            />
          </div>
          {!bothLimits && (hasUsl || hasLsl) ? (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Only one spec limit is set, so Cp is undefined and the one-sided
              index is shown in its place.
            </p>
          ) : null}
          {usingData && values.length > 0 && values.length < 25 ? (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              n = {values.length}. Capability indices are unstable below about
              25 to 30 measurements; treat this as a first look, not a verdict.
            </p>
          ) : null}
          <SectionNote>
            Cp = (USL − LSL) ÷ 6σ. Cpk = min((USL − mean), (mean − LSL)) ÷ 3σ.
            Sigma level is the distance from the mean to the nearest spec limit
            in standard deviations, and capability is that divided by three, so
            Cpk 1.33 is a 4σ process.
          </SectionNote>
          <FlowFooter>
            <ToolLink href="/qc-tools/control-chart">
              Is it in control?
            </ToolLink>
            <ToolLink href="/six-sigma/control-plan">Control plan</ToolLink>
            <ToolLink href="/six-sigma">Project hub</ToolLink>
          </FlowFooter>
        </CardContent>
      </Card>
    </div>
  )
}

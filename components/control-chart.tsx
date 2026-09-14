"use client"

import * as React from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
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
  Result,
  SectionNote,
  ToolLink,
  type Tone,
} from "@/components/calculator-primitives"
import { FlowFooter } from "@/components/six-sigma/shared"
import {
  imrLimits,
  nelsonTests,
  parseNumberList,
  parseSubgroups,
  xbarRLimits,
  NELSON_TEST_DESCRIPTIONS,
  type NelsonFailure,
} from "@/lib/six-sigma/stats"
import { useSixSigmaProject, type Project } from "@/lib/six-sigma/project-store"
import { ActivityIcon, InfoIcon } from "lucide-react"

type ChartKind = "imr" | "xbar-r"

const SUBGROUP_SEED = `74.2 76.8 71.5 78.1 75.0
73.4 79.6 72.8 77.3 75.9
70.9 76.2 74.7 81.4 73.9
75.5 77.8 72.1 76.4 74.0
78.9 73.2 75.8 71.7 76.9
74.8 75.1 73.6 77.0 74.4
76.1 74.3 78.2 72.9 75.2
73.8 76.6 74.9 75.4 77.1`

const chartConfig = {
  value: { label: "Measurement", color: "var(--chart-1)" },
  range: { label: "Moving range", color: "var(--chart-2)" },
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

/**
 * Chart with the centre line, control limits, and the 1σ/2σ zone bands the
 * eight special-cause tests refer to (zones C, B and A outward from centre).
 */
function LimitChart({
  data,
  center,
  ucl,
  lcl,
  sigma,
  showZones,
  height = "h-72",
  valueLabel,
}: {
  data: { label: string; value: number; violation: boolean }[]
  center: number
  ucl: number
  lcl: number
  sigma: number
  showZones: boolean
  height?: string
  valueLabel: string
}) {
  return (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <LineChart data={data} margin={{ top: 8, right: 32 }}>
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
          width={48}
          domain={["auto", "auto"]}
        />
        {showZones && sigma > 0 ? (
          <>
            <ReferenceArea
              y1={center - sigma}
              y2={center + sigma}
              fill="var(--chart-2)"
              fillOpacity={0.06}
              ifOverflow="extendDomain"
            />
            <ReferenceArea
              y1={center + sigma}
              y2={center + 2 * sigma}
              fill="var(--chart-4)"
              fillOpacity={0.06}
              ifOverflow="extendDomain"
            />
            <ReferenceArea
              y1={center - 2 * sigma}
              y2={center - sigma}
              fill="var(--chart-4)"
              fillOpacity={0.06}
              ifOverflow="extendDomain"
            />
          </>
        ) : null}
        <ReferenceLine
          y={center}
          stroke="var(--muted-foreground)"
          ifOverflow="extendDomain"
          label={{ value: "CL", position: "insideTopRight", fontSize: 11 }}
        />
        <ReferenceLine
          y={ucl}
          stroke="var(--destructive)"
          strokeDasharray="4 4"
          ifOverflow="extendDomain"
          label={{ value: "UCL", position: "insideTopRight", fontSize: 11 }}
        />
        <ReferenceLine
          y={lcl}
          stroke="var(--destructive)"
          strokeDasharray="4 4"
          ifOverflow="extendDomain"
          label={{ value: "LCL", position: "insideBottomRight", fontSize: 11 }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => Number(value).toFixed(3)}
            />
          }
        />
        <Line
          dataKey="value"
          name={valueLabel}
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={<Dot />}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}

function FailureList({
  failures,
  label,
}: {
  failures: NelsonFailure[]
  label: string
}) {
  if (failures.length === 0) return null
  const byTest = new Map<number, number[]>()
  for (const f of failures) {
    byTest.set(f.test, [...(byTest.get(f.test) ?? []), f.index + 1])
  }
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium">{label}</p>
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
            — at point{points.length > 1 ? "s" : ""} {points.join(", ")}
          </p>
        ))}
    </div>
  )
}

function useIndividualsChart(raw: string) {
  const values = parseNumberList(raw)
  const limits = imrLimits(values)
  const failures =
    values.length > 1 && limits.sigma > 0
      ? nelsonTests(values, limits.mean, limits.sigma)
      : []
  const violationIndexes = new Set(failures.map((f) => f.index))
  const data = values.map((v, i) => ({
    label: `#${i + 1}`,
    value: v,
    violation: violationIndexes.has(i),
  }))
  // Moving-range points start at the second observation.
  const mrFailures = limits.movingRanges
    .map((r, i) => (r > limits.mrUcl ? { test: 1 as const, index: i } : null))
    .filter((f): f is { test: 1; index: number } => f !== null)
  const mrViolations = new Set(mrFailures.map((f) => f.index))
  const mrData = limits.movingRanges.map((r, i) => ({
    label: `#${i + 2}`,
    value: r,
    violation: mrViolations.has(i),
  }))
  return { values, limits, failures, data, mrData, mrFailures }
}

function useSubgroupChart(raw: string) {
  const subgroups = parseSubgroups(raw)
  const limits = xbarRLimits(subgroups)
  const failures =
    limits.supported && limits.sigma > 0
      ? nelsonTests(limits.xbars, limits.xbarBar, limits.sigma)
      : []
  const violationIndexes = new Set(failures.map((f) => f.index))
  const data = limits.xbars.map((v, i) => ({
    label: `S${i + 1}`,
    value: v,
    violation: violationIndexes.has(i),
  }))
  const rFailures = limits.ranges
    .map((r, i) =>
      r > limits.rUcl || r < limits.rLcl ? { test: 1 as const, index: i } : null
    )
    .filter((f): f is { test: 1; index: number } => f !== null)
  const rViolations = new Set(rFailures.map((f) => f.index))
  const rData = limits.ranges.map((r, i) => ({
    label: `S${i + 1}`,
    value: r,
    violation: rViolations.has(i),
  }))
  return { subgroups, limits, failures, data, rData, rFailures }
}

export function ControlChartTool() {
  const [project, update] = useSixSigmaProject()
  const [kind, setKind] = React.useState<ChartKind>("imr")
  const [subgroupRaw, setSubgroupRaw] = React.useState(SUBGROUP_SEED)

  const ind = useIndividualsChart(project.measurementsRaw)
  const sub = useSubgroupChart(subgroupRaw)

  const isImr = kind === "imr"
  const failures = isImr ? ind.failures : sub.failures
  const secondaryFailures = isImr ? ind.mrFailures : sub.rFailures
  const totalSignals = failures.length + secondaryFailures.length
  const tone: Tone =
    totalSignals === 0 ? "good" : totalSignals <= 2 ? "warn" : "bad"

  const center = isImr ? ind.limits.mean : sub.limits.xbarBar
  const ucl = isImr ? ind.limits.ucl : sub.limits.ucl
  const lcl = isImr ? ind.limits.lcl : sub.limits.lcl
  const sigma = isImr ? ind.limits.sigma : sub.limits.sigma
  const enoughData = isImr ? ind.values.length > 1 : sub.limits.supported

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="@container/card lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="size-4" />
            Samples
          </CardTitle>
          <CardDescription>
            Measurements in the order they were collected. Order is what makes a
            control chart work, so never sort the data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cc-kind">Chart type</Label>
            <NativeSelect
              id="cc-kind"
              className="w-full"
              value={kind}
              onChange={(e) => setKind(e.target.value as ChartKind)}
            >
              <NativeSelectOption value="imr">
                I-MR — one reading at a time
              </NativeSelectOption>
              <NativeSelectOption value="xbar-r">
                X̄-R — subgroups of 2 to 10
              </NativeSelectOption>
            </NativeSelect>
            <SectionNote>
              {isImr
                ? "Use when data cannot be grouped: slow production, expensive measurement, or one reading per batch."
                : "Use when you can take several readings per period. Subgroups reveal within-group and between-group variation separately."}
            </SectionNote>
          </div>
          {isImr ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cc-data">
                Measurements ({project.spec.unit || "units"})
              </Label>
              <Textarea
                id="cc-data"
                rows={10}
                value={project.measurementsRaw}
                onChange={(e) =>
                  update((p: Project) => ({
                    ...p,
                    measurementsRaw: e.target.value,
                  }))
                }
              />
              <SectionNote>
                Shared with the capability and histogram tools. n ={" "}
                {ind.values.length}.
              </SectionNote>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cc-subgroups">Subgroups, one per line</Label>
              <Textarea
                id="cc-subgroups"
                rows={10}
                value={subgroupRaw}
                onChange={(e) => setSubgroupRaw(e.target.value)}
                className="font-mono text-xs"
              />
              <SectionNote>
                {sub.subgroups.length} subgroups of n = {sub.limits.n}.
                {sub.limits.unequalSizes
                  ? " Sizes are unequal, so the constants for the average size are used; equal subgroups are strongly preferred."
                  : ""}
              </SectionNote>
            </div>
          )}
          <FlowFooter>
            <ToolLink href="/six-sigma/capability">Capability</ToolLink>
            <ToolLink href="/six-sigma/attribute-chart">
              Pass/fail data
            </ToolLink>
            <ToolLink href="/six-sigma/control-plan">Control plan</ToolLink>
          </FlowFooter>
        </CardContent>
      </Card>

      <Card className="@container/card lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {isImr
              ? "Individuals & Moving Range (I-MR)"
              : "X̄-R Chart (subgroup mean and range)"}
          </CardTitle>
          <CardDescription>
            {!enoughData
              ? isImr
                ? "Enter at least two measurements."
                : "Enter at least two subgroups of 2 to 10 values each."
              : totalSignals === 0
                ? "No special-cause signals. The process is stable, which means its variation is predictable, not that it is good enough."
                : `${totalSignals} special-cause signal${totalSignals === 1 ? "" : "s"}. Investigate the cause before adjusting the process, or you will be reacting to noise.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LimitChart
            data={isImr ? ind.data : sub.data}
            center={center}
            ucl={ucl}
            lcl={lcl}
            sigma={sigma}
            showZones
            valueLabel={isImr ? "Measurement" : "Subgroup mean"}
          />
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {isImr
                ? "Moving range (variation between consecutive readings)"
                : "Range within each subgroup"}
            </p>
            <LimitChart
              data={isImr ? ind.mrData : sub.rData}
              center={isImr ? ind.limits.mrBar : sub.limits.rBar}
              ucl={isImr ? ind.limits.mrUcl : sub.limits.rUcl}
              lcl={isImr ? ind.limits.mrLcl : sub.limits.rLcl}
              sigma={0}
              showZones={false}
              height="h-40"
              valueLabel="Range"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Result
              label="Center line"
              value={enoughData ? center.toFixed(3) : "—"}
            />
            <Result label="UCL" value={enoughData ? ucl.toFixed(3) : "—"} />
            <Result label="LCL" value={enoughData ? lcl.toFixed(3) : "—"} />
            <Result
              label="Signals"
              value={String(totalSignals)}
              tone={enoughData ? tone : "default"}
            />
            <Result
              label="σ estimate"
              value={enoughData ? sigma.toFixed(4) : "—"}
              hint={isImr ? "from MR̄ ÷ 1.128" : "from R̄ × A₂ ÷ 3"}
            />
            <Result
              label={isImr ? "MR̄" : "R̄"}
              value={
                enoughData
                  ? (isImr ? ind.limits.mrBar : sub.limits.rBar).toFixed(3)
                  : "—"
              }
            />
            <Result
              label={isImr ? "Observations" : "Subgroups"}
              value={String(isImr ? ind.values.length : sub.subgroups.length)}
            />
            <Result
              label={isImr ? "Range UCL" : "R chart UCL"}
              value={
                enoughData
                  ? (isImr ? ind.limits.mrUcl : sub.limits.rUcl).toFixed(3)
                  : "—"
              }
            />
          </div>
          <FailureList
            failures={failures}
            label={isImr ? "Individuals chart" : "X̄ chart"}
          />
          <FailureList
            failures={secondaryFailures}
            label={isImr ? "Moving range chart" : "R chart"}
          />
          <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium">The eight tests</p>
              <ul className="grid gap-0.5 text-xs text-muted-foreground sm:grid-cols-2">
                {Object.entries(NELSON_TEST_DESCRIPTIONS).map(([n, text]) => (
                  <li key={n}>
                    {n}. {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <SectionNote>
            Control limits come from the process itself, never from the
            specification. Limits are mean ± 3σ, where σ is estimated from the
            short-term variation: MR̄ ÷ 1.128 for individuals, or R̄ × A₂ ÷ 3 for
            subgroups. The shaded bands are the 1σ and 2σ zones the pattern
            tests refer to. If the process has genuinely improved, recalculate
            the limits on the new data rather than keeping the old ones.
          </SectionNote>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Customized,
  ReferenceLine,
  XAxis,
  YAxis,
  type XAxisTickContentProps,
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
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { ProgressTrack, ProgressIndicator } from "@/components/ui/progress"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Field,
  Result,
  SectionNote,
  ToolLink,
  useNumberField,
} from "@/components/calculator-primitives"
import {
  GaugeIcon,
  TimerIcon,
  ScaleIcon,
  TrendingUpIcon,
  PlusIcon,
  XIcon,
  GripHorizontalIcon,
  AlertTriangleIcon,
} from "lucide-react"

function useOeeCalculator() {
  const shiftLength = useNumberField(480)
  const plannedStops = useNumberField(30)
  const unplannedDowntime = useNumberField(25)
  const idealCycleTime = useNumberField(0.45)
  const totalCount = useNumberField(950)
  const goodCount = useNumberField(918)

  const plannedProdTime = Math.max(shiftLength.value - plannedStops.value, 0)
  const runTime = Math.max(plannedProdTime - unplannedDowntime.value, 0)
  const availability = plannedProdTime > 0 ? runTime / plannedProdTime : 0
  // Performance is reported as measured, not clamped. Anything over 100% means
  // the line ran faster than its stated ideal cycle time, which is a data
  // problem (wrong ideal cycle time or overstated count), not a real score — so
  // it is flagged instead of silently capped.
  const performance =
    runTime > 0 ? (idealCycleTime.value * totalCount.value) / runTime : 0
  const performanceImpossible = performance > 1
  const quality = totalCount.value > 0 ? goodCount.value / totalCount.value : 0
  const oee = availability * performance * quality
  const tone: "good" | "warn" | "bad" =
    oee >= 0.85 ? "good" : oee >= 0.6 ? "warn" : "bad"

  // Six Big Losses breakdown, in minutes of the shift
  const netRunTime = runTime * performance
  const fullyProductiveTime = netRunTime * quality
  const availabilityLoss = plannedProdTime - runTime
  const speedLoss = runTime - netRunTime
  const qualityLoss = netRunTime - fullyProductiveTime

  const losses = [
    { key: "availability", label: "Availability", score: availability },
    { key: "performance", label: "Performance", score: performance },
    { key: "quality", label: "Quality", score: quality },
  ] as const
  const priority = losses.reduce((worst, l) =>
    l.score < worst.score ? l : worst
  )
  const improvementPotential = Math.max(1 - oee, 0)

  return {
    shiftLength,
    plannedStops,
    unplannedDowntime,
    idealCycleTime,
    totalCount,
    goodCount,
    availability,
    performance,
    performanceImpossible,
    quality,
    oee,
    tone,
    availabilityLoss,
    speedLoss,
    qualityLoss,
    priority,
    improvementPotential,
  }
}

const oeeChartConfig = {
  pct: { label: "Score" },
  availability: { label: "Availability", color: "var(--chart-1)" },
  performance: { label: "Performance", color: "var(--chart-2)" },
  quality: { label: "Quality", color: "var(--chart-3)" },
} satisfies ChartConfig

const pct = (n: number) => `${(n * 100).toFixed(1)}%`

function OeeInputsCard({ oee }: { oee: ReturnType<typeof useOeeCalculator> }) {
  return (
    <Card className="@container/card lg:col-span-1 lg:row-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GaugeIcon className="size-4" />
          Input params
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field
          id="oee-shift"
          label="Shift length"
          suffix="min"
          raw={oee.shiftLength.raw}
          setRaw={oee.shiftLength.setRaw}
        />
        <Field
          id="oee-planned-stops"
          label="Planned stop time"
          suffix="min"
          raw={oee.plannedStops.raw}
          setRaw={oee.plannedStops.setRaw}
        />
        <Field
          id="oee-unplanned-downtime"
          label="Unplanned downtime"
          suffix="min"
          raw={oee.unplannedDowntime.raw}
          setRaw={oee.unplannedDowntime.setRaw}
        />
        <Field
          id="oee-ideal-cycle"
          label="Ideal cycle time"
          suffix="min/unit"
          raw={oee.idealCycleTime.raw}
          setRaw={oee.idealCycleTime.setRaw}
        />
        <Field
          id="oee-total"
          label="Total units produced"
          raw={oee.totalCount.raw}
          setRaw={oee.totalCount.setRaw}
        />
        <Field
          id="oee-good"
          label="Good units"
          raw={oee.goodCount.raw}
          setRaw={oee.goodCount.setRaw}
        />
        <SectionNote className="mt-auto">
          OEE = Availability × Performance × Quality. Run time = shift length −
          planned stops − unplanned downtime.
        </SectionNote>
        <ToolLink href="/six-sigma">Back to DMAIC project</ToolLink>
      </CardContent>
    </Card>
  )
}

function OeeChartCard({ oee }: { oee: ReturnType<typeof useOeeCalculator> }) {
  const chartData = [
    {
      metric: "Availability",
      key: "availability",
      pct: oee.availability * 100,
    },
    { metric: "Performance", key: "performance", pct: oee.performance * 100 },
    { metric: "Quality", key: "quality", pct: oee.quality * 100 },
  ]
  return (
    <Card className="@container/card lg:col-span-2 lg:row-span-2">
      <CardHeader>
        <CardTitle>Effectiveness Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-5rem)]">
        <ChartContainer config={oeeChartConfig} className="h-full w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 8, right: 24 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              // Normally 0–100, but extend the axis if a score exceeds 100% so
              // the impossible-performance case stays visible instead of
              // running off the end of a clipped bar.
              domain={[
                0,
                (dataMax: number) => Math.max(100, Math.ceil(dataMax)),
              ]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="metric"
              width={90}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine
              x={85}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{
                value: "Target 85%",
                position: "insideTopRight",
                fontSize: 11,
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => `${Number(value).toFixed(1)}%`}
                />
              }
            />
            <Bar dataKey="pct" radius={4} barSize={36}>
              {chartData.map((d) => (
                <Cell key={d.key} fill={`var(--color-${d.key})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function OeeResultsCard({ oee }: { oee: ReturnType<typeof useOeeCalculator> }) {
  return (
    <Card className="@container/card lg:col-span-2 lg:row-span-1">
      <CardHeader>
        <CardTitle>Result</CardTitle>
        <CardDescription>
          <span className="font-medium text-foreground">
            {oee.priority.label}
          </span>{" "}
          is the bottleneck at {pct(oee.priority.score)} — potential gain{" "}
          <span className="inline-flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
            <TrendingUpIcon className="size-3" />+
            {pct(oee.improvementPotential)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Result label="Availability" value={pct(oee.availability)} />
          <Result
            label="Performance"
            value={pct(oee.performance)}
            tone={oee.performanceImpossible ? "bad" : "default"}
          />
          <Result label="Quality" value={pct(oee.quality)} />
          <Result label="OEE" value={pct(oee.oee)} tone={oee.tone} />
        </div>
        {oee.performanceImpossible ? (
          <p className="flex items-start gap-1.5 text-xs text-destructive">
            <AlertTriangleIcon className="mt-0.5 size-3 shrink-0" />
            Performance above 100% is not possible: the line cannot beat its own
            ideal cycle time. Check the ideal cycle time and the unit count
            before trusting this OEE.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

type StepInput = { id: string; raw: string }
type ProcessInput = { id: string; steps: StepInput[] }

function useTaktLineBalanceCalculator() {
  const shiftLength = useNumberField(480)
  const breaks = useNumberField(40)
  const demand = useNumberField(850)

  const availableMin = Math.max(shiftLength.value - breaks.value, 0)
  const availableSec = availableMin * 60
  const takt = demand.value > 0 ? availableSec / demand.value : 0
  const hasTakt = takt > 0
  const hourlyOutput = hasTakt ? 3600 / takt : 0

  const seedTimes = [38, 42, 45, 40, 36]
  const idCounter = React.useRef(seedTimes.length)
  const nextId = () => `id-${++idCounter.current}`

  const [processes, setProcesses] = React.useState<ProcessInput[]>(() =>
    seedTimes.map((time, i) => ({
      id: `id-${i + 1}`,
      steps: [{ id: `id-${i + 1}-1`, raw: String(time) }],
    }))
  )

  const addProcess = () =>
    setProcesses((prev) => [
      ...prev,
      { id: nextId(), steps: [{ id: nextId(), raw: "30" }] },
    ])
  const removeProcess = (processId: string) =>
    setProcesses((prev) => prev.filter((p) => p.id !== processId))
  const addStep = (processId: string) =>
    setProcesses((prev) =>
      prev.map((p) =>
        p.id === processId
          ? { ...p, steps: [...p.steps, { id: nextId(), raw: "10" }] }
          : p
      )
    )
  const removeStep = (processId: string, stepId: string) =>
    setProcesses((prev) =>
      prev.map((p) =>
        p.id === processId
          ? { ...p, steps: p.steps.filter((s) => s.id !== stepId) }
          : p
      )
    )
  const setStepTime = (processId: string, stepId: string, raw: string) =>
    setProcesses((prev) =>
      prev.map((p) =>
        p.id === processId
          ? {
              ...p,
              steps: p.steps.map((s) => (s.id === stepId ? { ...s, raw } : s)),
            }
          : p
      )
    )

  const processTotals = processes.map((p, i) => {
    const total = p.steps.reduce((sum, s) => {
      const n = Number(s.raw)
      return sum + (Number.isFinite(n) ? Math.max(n, 0) : 0)
    }, 0)
    return { id: p.id, name: `P${i + 1}`, total }
  })

  const totalContent = processTotals.reduce((a, p) => a + p.total, 0)
  const numProcesses = processTotals.length
  const bottleneck = numProcesses
    ? Math.max(...processTotals.map((p) => p.total))
    : 0
  const hasContent = totalContent > 0 && bottleneck > 0

  // Line efficiency vs. the actual bottleneck station (standard IE formula:
  // sum of task times / (stations × bottleneck cycle time)).
  const efficiency = hasContent ? totalContent / (bottleneck * numProcesses) : 0
  const balanceLoss = hasContent ? Math.max(1 - efficiency, 0) : 0
  // Smoothness index: RMS of each process's idle time relative to the bottleneck.
  const smoothnessIndex = hasContent
    ? Math.sqrt(
        processTotals.reduce((sum, p) => sum + (bottleneck - p.total) ** 2, 0)
      )
    : 0

  // Required operators = total work content ÷ takt time, rounded up — the
  // same formula as the theoretical minimum number of workstations.
  const requiredStaff =
    hasTakt && totalContent > 0
      ? Math.max(Math.ceil(totalContent / takt), 0)
      : 0
  const staffEfficiency =
    requiredStaff > 0 && hasTakt ? totalContent / (requiredStaff * takt) : 0

  const lineStatus: "meets" | "behind" | "unknown" =
    !hasTakt || !hasContent
      ? "unknown"
      : bottleneck <= takt
        ? "meets"
        : "behind"

  const capacityPerShift = bottleneck > 0 ? availableSec / bottleneck : 0
  const capacityGap =
    hasTakt && capacityPerShift > 0 ? capacityPerShift - demand.value : 0

  const tone: "good" | "warn" | "bad" =
    efficiency >= 0.85 ? "good" : efficiency >= 0.7 ? "warn" : "bad"

  return {
    shiftLength,
    breaks,
    demand,
    takt,
    hasTakt,
    hourlyOutput,
    requiredStaff,
    staffEfficiency,
    processes,
    processTotals,
    totalContent,
    bottleneck,
    numProcesses,
    hasContent,
    efficiency,
    balanceLoss,
    smoothnessIndex,
    lineStatus,
    capacityPerShift,
    capacityGap,
    tone,
    addProcess,
    removeProcess,
    addStep,
    removeStep,
    setStepTime,
  }
}

// Green in the 80–95% "well-staffed" band; red past 95% flags cycle time
// right up against takt with no slack for variation, default otherwise.
function efficiencyBarColor(pct: number) {
  if (pct > 95) return "bg-destructive"
  if (pct >= 80) return "bg-green-600 dark:bg-green-400"
  return "bg-primary"
}

const lineBalanceChartConfig = {
  total: { label: "Process time" },
} satisfies ChartConfig

// X-axis tick that flags processes whose total time exceeds takt (destructive
// color) without touching the deliberately uniform stacked-bar fill.
function makeProcessTick(overTakt: Set<string>) {
  return function ProcessTick({ x, y, payload }: XAxisTickContentProps) {
    const value = String(payload.value)
    const isOver = overTakt.has(value)
    return (
      <text
        x={x}
        y={y}
        dy={12}
        textAnchor="middle"
        className={
          isOver
            ? "fill-destructive text-xs font-medium"
            : "fill-muted-foreground text-xs"
        }
      >
        {value}
      </text>
    )
  }
}

// Stone scale (300 → 700), light → dark, used to shade successive steps
// within a stacked process bar. Clamped away from 50/100/200 (too faint on
// a white light-mode card) and 800/900 (collide with the dark-mode card and
// muted-surface tokens — see app/globals.css), so every segment stays
// visible in both themes.
const STEP_COLORS = [
  "var(--color-stone-300)",
  "var(--color-stone-400)",
  "var(--color-stone-500)",
  "var(--color-stone-600)",
  "var(--color-stone-700)",
]

function TaktInputsCard({
  tlb,
}: {
  tlb: ReturnType<typeof useTaktLineBalanceCalculator>
}) {
  return (
    <Card className="@container/card lg:col-span-1 lg:row-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TimerIcon className="size-4" />
          Input params
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <Field
          id="tlb-shift"
          label="Available shift time"
          suffix="min"
          raw={tlb.shiftLength.raw}
          setRaw={tlb.shiftLength.setRaw}
        />
        <Field
          id="tlb-breaks"
          label="Breaks / meetings"
          suffix="min"
          raw={tlb.breaks.raw}
          setRaw={tlb.breaks.setRaw}
        />
        <Field
          id="tlb-demand"
          label="Customer demand"
          suffix="units/shift"
          className="col-span-2"
          raw={tlb.demand.raw}
          setRaw={tlb.demand.setRaw}
        />
      </CardContent>
    </Card>
  )
}

function TaktResultsCard({
  tlb,
}: {
  tlb: ReturnType<typeof useTaktLineBalanceCalculator>
}) {
  return (
    <Card className="@container/card lg:col-span-2 lg:row-span-1">
      <CardHeader>
        <CardTitle>Takt Time Result</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Result
            label="Takt time"
            value={tlb.hasTakt ? `${tlb.takt.toFixed(1)} s/unit` : "—"}
          />
          <Result
            label="Target hourly output"
            value={
              tlb.hourlyOutput > 0 ? `${tlb.hourlyOutput.toFixed(0)}/hr` : "—"
            }
          />
          <Result
            label="Bottleneck"
            value={tlb.hasContent ? `${tlb.bottleneck.toFixed(1)} s` : "—"}
            tone={
              tlb.lineStatus === "unknown"
                ? "default"
                : tlb.lineStatus === "meets"
                  ? "good"
                  : "bad"
            }
          />
          <Result
            label="Line status"
            value={
              tlb.lineStatus === "unknown"
                ? "—"
                : tlb.lineStatus === "meets"
                  ? "Meets takt"
                  : "Behind takt"
            }
            tone={
              tlb.lineStatus === "unknown"
                ? "default"
                : tlb.lineStatus === "meets"
                  ? "good"
                  : "bad"
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col justify-center gap-2 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Required Staff
              </span>
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {tlb.requiredStaff}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ppl
                </span>
              </span>
            </div>
            <ProgressPrimitive.Root value={tlb.staffEfficiency * 100}>
              <ProgressTrack>
                <ProgressIndicator
                  className={efficiencyBarColor(tlb.staffEfficiency * 100)}
                />
              </ProgressTrack>
            </ProgressPrimitive.Root>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                vs. theoretical minimum
              </span>
              <span className="text-xs font-medium text-foreground tabular-nums">
                {(tlb.staffEfficiency * 100).toFixed(0)}% utilized
              </span>
            </div>
          </div>
          <Result
            label="Shift capacity vs. demand"
            value={
              tlb.capacityPerShift > 0
                ? `${Math.floor(tlb.capacityPerShift)} units (${
                    tlb.capacityGap >= 0 ? "+" : ""
                  }${Math.floor(tlb.capacityGap)})`
                : "—"
            }
            tone={
              tlb.capacityPerShift <= 0
                ? "default"
                : tlb.capacityGap >= 0
                  ? "good"
                  : "bad"
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}

const LINE_BALANCE_DRAWER_SNAP_POINTS = ["31rem", 1]

function ProcessInputsDrawer({
  tlb,
}: {
  tlb: ReturnType<typeof useTaktLineBalanceCalculator>
}) {
  return (
    <Drawer snapPoints={LINE_BALANCE_DRAWER_SNAP_POINTS} showSwipeHandle>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            className="absolute inset-x-0 bottom-0 z-10 h-11 justify-center gap-2 rounded-none rounded-t-lg border-t bg-card text-xs font-medium text-muted-foreground hover:bg-muted/50"
          >
            <GripHorizontalIcon className="size-4" />
            Process inputs — drag or click to expand
          </Button>
        }
      />
      <DrawerContent>
        <DrawerHeader className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <span aria-hidden className="h-7" />
          <DrawerTitle className="text-center">Process inputs</DrawerTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1 justify-self-end text-xs"
            onClick={tlb.addProcess}
          >
            <PlusIcon className="size-3" />
            Process
          </Button>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-wrap gap-3">
            {tlb.processes.map((p, i) => (
              <div
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    Process {i + 1}
                  </span>
                  {tlb.processes.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5"
                      onClick={() => tlb.removeProcess(p.id)}
                    >
                      <XIcon className="size-3" />
                      <span className="sr-only">Remove process</span>
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  {p.steps.map((s, si) => (
                    <div key={s.id} className="flex items-center gap-1.5">
                      <Label
                        htmlFor={`tlb-step-${s.id}`}
                        className="w-11 text-xs font-normal text-muted-foreground"
                      >
                        Step {si + 1}
                      </Label>
                      <div className="relative">
                        <Input
                          id={`tlb-step-${s.id}`}
                          inputMode="decimal"
                          aria-label={`Process ${i + 1} step ${si + 1} time in seconds`}
                          value={s.raw}
                          onChange={(e) =>
                            tlb.setStepTime(p.id, s.id, e.target.value)
                          }
                          className="h-8 w-20 pr-6 text-sm"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
                          s
                        </span>
                      </div>
                      {p.steps.length > 1 ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => tlb.removeStep(p.id, s.id)}
                        >
                          <XIcon className="size-3" />
                          <span className="sr-only">Remove step</span>
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 justify-start gap-1 text-xs"
                    onClick={() => tlb.addStep(p.id)}
                  >
                    <PlusIcon className="size-3" />
                    Step
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose render={<Button>Done</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

// Draws a "Bottleneck" callout above the stacked bar for the constraining
// process, positioned via the chart's own x/y scales so it stays correct
// regardless of how many steps are stacked in that column.
function BottleneckMarker(props: {
  xAxisMap?: Record<string, { scale: (v: string) => number; bandSize?: number }>
  yAxisMap?: Record<string, { scale: (v: number) => number }>
  bottleneckName: string | null
  bottleneckTotal: number
}) {
  const { xAxisMap, yAxisMap, bottleneckName, bottleneckTotal } = props
  if (!bottleneckName || !xAxisMap || !yAxisMap) return null
  const xAxis = Object.values(xAxisMap)[0]
  const yAxis = Object.values(yAxisMap)[0]
  if (!xAxis || !yAxis) return null
  const bandSize = xAxis.bandSize ?? 0
  const x = xAxis.scale(bottleneckName) + bandSize / 2
  const y = yAxis.scale(bottleneckTotal)
  return (
    <g>
      <line
        x1={x}
        x2={x}
        y1={y - 20}
        y2={y - 4}
        stroke="var(--destructive)"
        strokeWidth={1.5}
      />
      <path
        d={`M ${x - 4} ${y - 8} L ${x} ${y - 2} L ${x + 4} ${y - 8} Z`}
        fill="var(--destructive)"
      />
      <text
        x={x}
        y={y - 24}
        textAnchor="middle"
        className="fill-destructive text-[10px] font-semibold tracking-wide uppercase"
      >
        Bottleneck
      </text>
    </g>
  )
}

function LineBalanceChartCard({
  tlb,
}: {
  tlb: ReturnType<typeof useTaktLineBalanceCalculator>
}) {
  const maxSteps = tlb.processes.reduce(
    (max, p) => Math.max(max, p.steps.length),
    0
  )
  const chartData = tlb.processes.map((p, i) => {
    const row: Record<string, number | string> = { id: p.id, name: `P${i + 1}` }
    p.steps.forEach((s, si) => {
      const n = Number(s.raw)
      row[`step${si}`] = Number.isFinite(n) ? Math.max(n, 0) : 0
    })
    return row
  })
  const overTaktProcesses = new Set(
    tlb.hasTakt
      ? tlb.processTotals.filter((p) => p.total > tlb.takt).map((p) => p.name)
      : []
  )
  // First process whose total time equals the line's bottleneck cycle time.
  const bottleneckProcess = tlb.hasContent
    ? (tlb.processTotals.find((p) => p.total === tlb.bottleneck) ?? null)
    : null

  return (
    <Card className="@container/card lg:col-span-3 lg:row-span-2 lg:pb-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScaleIcon className="size-4" />
          Line Balance
        </CardTitle>
        <CardDescription>
          Balance efficiency {(tlb.efficiency * 100).toFixed(1)}% (loss{" "}
          {(tlb.balanceLoss * 100).toFixed(1)}%) · total work content{" "}
          {tlb.totalContent.toFixed(1)}s across {tlb.numProcesses} process
          {tlb.numProcesses === 1 ? "" : "es"} · smoothness index{" "}
          {tlb.smoothnessIndex.toFixed(1)}s
          {bottleneckProcess ? (
            <>
              {" "}
              ·{" "}
              <span className="font-medium text-destructive">
                {bottleneckProcess.name} is the bottleneck
              </span>{" "}
              at {bottleneckProcess.total.toFixed(1)}s
            </>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative min-h-0 flex-1 overflow-hidden">
        <ChartContainer
          config={lineBalanceChartConfig}
          className="h-full w-full pb-11"
        >
          <BarChart data={chartData} margin={{ top: 28, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={makeProcessTick(overTaktProcesses)}
            />
            <YAxis
              tickFormatter={(v) => `${v}s`}
              tickLine={false}
              axisLine={false}
            />
            {tlb.hasTakt ? (
              <ReferenceLine
                y={tlb.takt}
                ifOverflow="extendDomain"
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                label={{
                  value: `Takt ${tlb.takt.toFixed(1)}s`,
                  position: "insideTopRight",
                  fontSize: 11,
                }}
              />
            ) : null}
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {Number(value).toFixed(1)} s
                      </span>
                    </div>
                  )}
                />
              }
            />
            {Array.from({ length: maxSteps }).map((_, si) => (
              <Bar
                key={si}
                dataKey={`step${si}`}
                name={`Step ${si + 1}`}
                stackId="process"
                fill={STEP_COLORS[si % STEP_COLORS.length]}
                stroke="var(--card)"
                strokeWidth={2}
                radius={2}
              />
            ))}
            <Customized
              component={
                <BottleneckMarker
                  bottleneckName={bottleneckProcess?.name ?? null}
                  bottleneckTotal={bottleneckProcess?.total ?? 0}
                />
              }
            />
          </BarChart>
        </ChartContainer>
        <ProcessInputsDrawer tlb={tlb} />
      </CardContent>
    </Card>
  )
}

export function OeeCalculatorCard() {
  const oee = useOeeCalculator()
  return (
    <div className="grid gap-4 lg:h-180 lg:grid-cols-3 lg:grid-rows-3">
      <OeeInputsCard oee={oee} />
      <OeeChartCard oee={oee} />
      <OeeResultsCard oee={oee} />
    </div>
  )
}

export function TaktLineBalanceCalculatorCard() {
  const tlb = useTaktLineBalanceCalculator()
  return (
    <div className="grid gap-4 lg:h-[calc(100dvh-var(--header-height)-3rem)] lg:grid-cols-3 lg:grid-rows-3">
      <TaktInputsCard tlb={tlb} />
      <TaktResultsCard tlb={tlb} />
      <LineBalanceChartCard tlb={tlb} />
    </div>
  )
}

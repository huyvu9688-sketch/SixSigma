"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
import { Result } from "@/components/calculator-primitives"
import { PlusIcon, XIcon, RouteIcon } from "lucide-react"

type StepRow = {
  id: string
  name: string
  processTime: string // value-added time, seconds
  waitTime: string // motion/queue/transport time, seconds
}

const SEED_STEPS: Omit<StepRow, "id">[] = [
  { name: "Receive material", processTime: "20", waitTime: "600" },
  { name: "Walk to machine", processTime: "0", waitTime: "45" },
  { name: "Load & cycle", processTime: "38", waitTime: "0" },
  { name: "Inspect", processTime: "15", waitTime: "120" },
  { name: "Move to next station", processTime: "0", waitTime: "90" },
  { name: "Pack", processTime: "25", waitTime: "300" },
]

function useValueStreamMap() {
  const idCounter = React.useRef(SEED_STEPS.length)
  const nextId = () => `step-${++idCounter.current}`
  const [steps, setSteps] = React.useState<StepRow[]>(() =>
    SEED_STEPS.map((s, i) => ({ id: `step-${i + 1}`, ...s }))
  )

  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      { id: nextId(), name: "", processTime: "0", waitTime: "0" },
    ])
  const removeStep = (id: string) =>
    setSteps((prev) => prev.filter((s) => s.id !== id))
  const setName = (id: string, name: string) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
  const setProcessTime = (id: string, processTime: string) =>
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, processTime } : s))
    )
  const setWaitTime = (id: string, waitTime: string) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, waitTime } : s)))

  const num = (raw: string) => {
    const n = Number(raw)
    return Number.isFinite(n) ? Math.max(n, 0) : 0
  }

  const chartData = steps.map((s, i) => ({
    id: s.id,
    name: s.name || `Step ${i + 1}`,
    process: num(s.processTime),
    wait: num(s.waitTime),
  }))

  const totalProcessTime = chartData.reduce((sum, s) => sum + s.process, 0)
  const totalWaitTime = chartData.reduce((sum, s) => sum + s.wait, 0)
  const totalLeadTime = totalProcessTime + totalWaitTime
  // Process Cycle Efficiency: the lean benchmark for how much of total lead
  // time is actually value-added work vs. motion/wait/transport waste.
  const pce = totalLeadTime > 0 ? (totalProcessTime / totalLeadTime) * 100 : 0
  const tone: "good" | "warn" | "bad" =
    pce >= 25 ? "good" : pce >= 10 ? "warn" : "bad"

  return {
    steps,
    addStep,
    removeStep,
    setName,
    setProcessTime,
    setWaitTime,
    chartData,
    totalProcessTime,
    totalWaitTime,
    totalLeadTime,
    pce,
    tone,
  }
}

const vsmChartConfig = {
  process: { label: "Value-added time", color: "var(--chart-2)" },
  wait: { label: "Wait / motion / transport", color: "var(--chart-5)" },
} satisfies ChartConfig

function formatSeconds(sec: number) {
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)} hr`
  if (sec >= 60) return `${(sec / 60).toFixed(1)} min`
  return `${sec.toFixed(0)} s`
}

function VsmInputsCard({ vsm }: { vsm: ReturnType<typeof useValueStreamMap> }) {
  return (
    <Card className="@container/card lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RouteIcon className="size-4" />
          Process Steps
        </CardTitle>
        <CardDescription>
          Split each step into value-added processing time vs. wait / motion /
          transport time (seconds)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_4.5rem_4.5rem_auto] gap-1.5 text-xs text-muted-foreground">
          <span>Step</span>
          <span>VA time</span>
          <span>Wait time</span>
          <span />
        </div>
        {vsm.steps.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-[1fr_4.5rem_4.5rem_auto] items-center gap-1.5"
          >
            <Input
              aria-label="Step name"
              placeholder="Step name"
              value={s.name}
              onChange={(e) => vsm.setName(s.id, e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              aria-label="Value-added time"
              inputMode="decimal"
              value={s.processTime}
              onChange={(e) => vsm.setProcessTime(s.id, e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              aria-label="Wait time"
              inputMode="decimal"
              value={s.waitTime}
              onChange={(e) => vsm.setWaitTime(s.id, e.target.value)}
              className="h-8 text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={() => vsm.removeStep(s.id)}
            >
              <XIcon className="size-3" />
              <span className="sr-only">Remove step</span>
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-fit gap-1 text-xs"
          onClick={vsm.addStep}
        >
          <PlusIcon className="size-3" />
          Step
        </Button>
      </CardContent>
    </Card>
  )
}

function VsmChartCard({ vsm }: { vsm: ReturnType<typeof useValueStreamMap> }) {
  return (
    <Card className="@container/card lg:col-span-2">
      <CardHeader>
        <CardTitle>Value Stream Timeline</CardTitle>
        <CardDescription>
          Process Cycle Efficiency (PCE) = value-added time ÷ total lead time —
          lean processes target 25%+
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={vsmChartConfig} className="h-72 w-full">
          <BarChart
            data={vsm.chartData}
            layout="vertical"
            margin={{ left: 8, right: 24 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => formatSeconds(Number(v))}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {formatSeconds(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="process"
              name="Value-added time"
              stackId="lead"
              fill="var(--color-process)"
              radius={2}
            />
            <Bar
              dataKey="wait"
              name="Wait / motion / transport"
              stackId="lead"
              fill="var(--color-wait)"
              radius={2}
            />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Result
            label="Total lead time"
            value={formatSeconds(vsm.totalLeadTime)}
          />
          <Result
            label="Value-added time"
            value={formatSeconds(vsm.totalProcessTime)}
          />
          <Result
            label="Wait / motion time"
            value={formatSeconds(vsm.totalWaitTime)}
            tone="bad"
          />
          <Result
            label="Process Cycle Efficiency"
            value={`${vsm.pce.toFixed(1)}%`}
            tone={vsm.tone}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function ValueStreamMapCard() {
  const vsm = useValueStreamMap()
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <VsmInputsCard vsm={vsm} />
      <VsmChartCard vsm={vsm} />
    </div>
  )
}

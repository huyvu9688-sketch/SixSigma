"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
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
  Field,
  Result,
  useNumberField,
} from "@/components/calculator-primitives"
import { PlusIcon, XIcon, MilestoneIcon } from "lucide-react"

type TaskRow = {
  id: string
  name: string
  start: string // day offset from project start
  duration: string // days
  percentComplete: string // 0-100
}

const SEED_TASKS: Omit<TaskRow, "id">[] = [
  {
    name: "Kickoff & scope",
    start: "0",
    duration: "2",
    percentComplete: "100",
  },
  { name: "Design layout", start: "2", duration: "5", percentComplete: "100" },
  {
    name: "Procure equipment",
    start: "5",
    duration: "10",
    percentComplete: "60",
  },
  { name: "Install & wire", start: "15", duration: "6", percentComplete: "0" },
  {
    name: "Commission & test",
    start: "21",
    duration: "4",
    percentComplete: "0",
  },
  {
    name: "Operator training",
    start: "23",
    duration: "3",
    percentComplete: "0",
  },
]

function useGanttChart() {
  const idCounter = React.useRef(SEED_TASKS.length)
  const nextId = () => `task-${++idCounter.current}`
  const [tasks, setTasks] = React.useState<TaskRow[]>(() =>
    SEED_TASKS.map((t, i) => ({ id: `task-${i + 1}`, ...t }))
  )
  const today = useNumberField(12)

  const addTask = () =>
    setTasks((prev) => [
      ...prev,
      {
        id: nextId(),
        name: "",
        start: "0",
        duration: "1",
        percentComplete: "0",
      },
    ])
  const removeTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id))
  const update = (id: string, patch: Partial<TaskRow>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const num = (raw: string) => {
    const n = Number(raw)
    return Number.isFinite(n) ? Math.max(n, 0) : 0
  }
  const pct = (raw: string) => Math.min(Math.max(num(raw), 0), 100)

  const chartData = tasks.map((t, i) => {
    const duration = num(t.duration)
    const done = (duration * pct(t.percentComplete)) / 100
    return {
      id: t.id,
      name: t.name || `Task ${i + 1}`,
      start: num(t.start),
      done,
      remaining: Math.max(duration - done, 0),
      end: num(t.start) + duration,
    }
  })

  const projectEnd = chartData.reduce((max, t) => Math.max(max, t.end), 0)
  const overallPct =
    tasks.length > 0
      ? chartData.reduce(
          (sum, t, i) => sum + pct(tasks[i].percentComplete),
          0
        ) / tasks.length
      : 0
  const tasksAtRisk = chartData.filter(
    (t) => t.end < today.value && t.remaining > 0
  ).length

  return {
    tasks,
    addTask,
    removeTask,
    update,
    today,
    chartData,
    projectEnd,
    overallPct,
    tasksAtRisk,
  }
}

const ganttChartConfig = {
  done: { label: "Complete", color: "var(--chart-2)" },
  remaining: { label: "Remaining", color: "var(--chart-1)" },
} satisfies ChartConfig

function GanttInputsCard({ gc }: { gc: ReturnType<typeof useGanttChart> }) {
  return (
    <Card className="@container/card lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MilestoneIcon className="size-4" />
          Tasks
        </CardTitle>
        <CardDescription>
          Start day and duration are relative to project day 0
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field
          id="gantt-today"
          label="Current day"
          raw={gc.today.raw}
          setRaw={gc.today.setRaw}
        />
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_3rem_3rem_3rem_auto] gap-1.5 text-xs text-muted-foreground">
            <span>Task</span>
            <span>Start</span>
            <span>Dur.</span>
            <span>%</span>
            <span />
          </div>
          {gc.tasks.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-[1fr_3rem_3rem_3rem_auto] items-center gap-1.5"
            >
              <Input
                aria-label="Task name"
                placeholder="Task"
                value={t.name}
                onChange={(e) => gc.update(t.id, { name: e.target.value })}
                className="h-8 text-sm"
              />
              <Input
                aria-label="Start day"
                inputMode="numeric"
                value={t.start}
                onChange={(e) => gc.update(t.id, { start: e.target.value })}
                className="h-8 text-sm"
              />
              <Input
                aria-label="Duration in days"
                inputMode="numeric"
                value={t.duration}
                onChange={(e) => gc.update(t.id, { duration: e.target.value })}
                className="h-8 text-sm"
              />
              <Input
                aria-label="Percent complete"
                inputMode="numeric"
                value={t.percentComplete}
                onChange={(e) =>
                  gc.update(t.id, { percentComplete: e.target.value })
                }
                className="h-8 text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() => gc.removeTask(t.id)}
              >
                <XIcon className="size-3" />
                <span className="sr-only">Remove task</span>
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-fit gap-1 text-xs"
            onClick={gc.addTask}
          >
            <PlusIcon className="size-3" />
            Task
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function GanttTimelineCard({ gc }: { gc: ReturnType<typeof useGanttChart> }) {
  return (
    <Card className="@container/card lg:col-span-2">
      <CardHeader>
        <CardTitle>Gantt Chart</CardTitle>
        <CardDescription>
          Project spans {gc.projectEnd.toFixed(0)} days · overall{" "}
          {gc.overallPct.toFixed(0)}% complete
          {gc.tasksAtRisk > 0
            ? ` · ${gc.tasksAtRisk} task${gc.tasksAtRisk === 1 ? "" : "s"} behind schedule`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer
          config={ganttChartConfig}
          className="h-80 w-full"
          style={{
            height: `${Math.max(gc.chartData.length * 34 + 40, 240)}px`,
          }}
        >
          <BarChart
            data={gc.chartData}
            layout="vertical"
            margin={{ left: 8, right: 24 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              domain={[0, "dataMax"]}
              tickFormatter={(v) => `Day ${v}`}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ReferenceLine
              x={gc.today.value}
              stroke="var(--destructive)"
              strokeDasharray="4 4"
              label={{
                value: "Today",
                position: "insideTopRight",
                fontSize: 11,
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {Number(value).toFixed(1)}d
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="start"
              stackId="task"
              fill="transparent"
              legendType="none"
              isAnimationActive={false}
            />
            <Bar
              dataKey="done"
              name="Complete"
              stackId="task"
              fill="var(--color-done)"
              radius={2}
            />
            <Bar
              dataKey="remaining"
              name="Remaining"
              stackId="task"
              fill="var(--color-remaining)"
              radius={2}
            />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Result
            label="Project length"
            value={`${gc.projectEnd.toFixed(0)} days`}
          />
          <Result
            label="Overall complete"
            value={`${gc.overallPct.toFixed(0)}%`}
          />
          <Result
            label="Tasks behind schedule"
            value={String(gc.tasksAtRisk)}
            tone={gc.tasksAtRisk > 0 ? "bad" : "good"}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function GanttChartCard() {
  const gc = useGanttChart()
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <GanttInputsCard gc={gc} />
      <GanttTimelineCard gc={gc} />
    </div>
  )
}

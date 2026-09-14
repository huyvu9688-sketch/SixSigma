"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

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
import { Input } from "@/components/ui/input"
import {
  Field,
  Result,
  useNumberField,
} from "@/components/calculator-primitives"
import { TrashIcon } from "lucide-react"

// The 8 wastes of lean manufacturing, spelling DOWNTIME.
const MUDA_TYPES = [
  { key: "defects", label: "Defects", seed: 6 },
  { key: "overproduction", label: "Overproduction", seed: 3 },
  { key: "waiting", label: "Waiting", seed: 8 },
  { key: "nonUtilizedTalent", label: "Non-utilized talent", seed: 4 },
  { key: "transportation", label: "Transportation", seed: 5 },
  { key: "inventory", label: "Inventory", seed: 7 },
  { key: "motion", label: "Motion", seed: 6 },
  { key: "extraProcessing", label: "Extra-processing", seed: 2 },
] as const

type MudaKey = (typeof MUDA_TYPES)[number]["key"]

function useMudaCalculator() {
  const availableHours = useNumberField(40)
  const costPerHour = useNumberField(65)

  const [hoursLost, setHoursLost] = React.useState<Record<MudaKey, string>>(
    () =>
      Object.fromEntries(
        MUDA_TYPES.map((m) => [m.key, String(m.seed)])
      ) as Record<MudaKey, string>
  )
  const setHours = (key: MudaKey, raw: string) =>
    setHoursLost((prev) => ({ ...prev, [key]: raw }))

  const rows = MUDA_TYPES.map((m) => {
    const n = Number(hoursLost[m.key])
    const hours = Number.isFinite(n) ? Math.max(n, 0) : 0
    const cost = hours * costPerHour.value
    const pctOfCapacity =
      availableHours.value > 0 ? (hours / availableHours.value) * 100 : 0
    return { key: m.key, label: m.label, hours, cost, pctOfCapacity }
  }).sort((a, b) => b.hours - a.hours)

  const totalHours = rows.reduce((sum, r) => sum + r.hours, 0)
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0)
  const totalPct =
    availableHours.value > 0 ? (totalHours / availableHours.value) * 100 : 0

  const tone: "good" | "warn" | "bad" =
    totalPct <= 10 ? "good" : totalPct <= 25 ? "warn" : "bad"

  return {
    availableHours,
    costPerHour,
    hoursLost,
    setHours,
    rows,
    totalHours,
    totalCost,
    totalPct,
    tone,
  }
}

const mudaChartConfig = {
  hours: { label: "Hours lost / week" },
} satisfies ChartConfig

function barColor(pctOfCapacity: number) {
  if (pctOfCapacity >= 15) return "var(--destructive)"
  if (pctOfCapacity >= 7) return "var(--chart-4)"
  return "var(--chart-2)"
}

function MudaInputsCard({ mc }: { mc: ReturnType<typeof useMudaCalculator> }) {
  return (
    <Card className="@container/card lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrashIcon className="size-4" />
          Muda (8 Wastes)
        </CardTitle>
        <CardDescription>
          Estimate hours lost per week to each DOWNTIME waste category
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field
          id="muda-available"
          label="Available hours / week"
          raw={mc.availableHours.raw}
          setRaw={mc.availableHours.setRaw}
        />
        <Field
          id="muda-cost"
          label="Cost per hour"
          suffix="$"
          raw={mc.costPerHour.raw}
          setRaw={mc.costPerHour.setRaw}
        />
        <div className="flex flex-col gap-1.5">
          {MUDA_TYPES.map((m) => (
            <div key={m.key} className="flex items-center gap-1.5">
              <label
                htmlFor={`muda-${m.key}`}
                className="w-36 shrink-0 text-xs text-muted-foreground"
              >
                {m.label}
              </label>
              <Input
                id={`muda-${m.key}`}
                inputMode="decimal"
                value={mc.hoursLost[m.key]}
                onChange={(e) => mc.setHours(m.key, e.target.value)}
                className="h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">hr/wk</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MudaChartCard({ mc }: { mc: ReturnType<typeof useMudaCalculator> }) {
  return (
    <Card className="@container/card lg:col-span-2">
      <CardHeader>
        <CardTitle>Waste Ranking</CardTitle>
        <CardDescription>
          Waste is consuming {mc.totalPct.toFixed(1)}% of available capacity · $
          {mc.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          /week
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={mudaChartConfig} className="h-72 w-full">
          <BarChart
            data={mc.rows}
            layout="vertical"
            margin={{ left: 8, right: 24 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}h`}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {Number(value).toFixed(1)}h (
                        {item.payload.pctOfCapacity.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="hours" name="Hours lost" radius={4} barSize={22}>
              {mc.rows.map((r) => (
                <Cell key={r.key} fill={barColor(r.pctOfCapacity)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Result
            label="Top waste"
            value={mc.rows[0]?.label ?? "—"}
            tone="bad"
          />
          <Result
            label="Total hours lost"
            value={`${mc.totalHours.toFixed(1)} hr/wk`}
          />
          <Result
            label="Total cost"
            value={`$${mc.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}/wk`}
          />
          <Result
            label="% of capacity lost"
            value={`${mc.totalPct.toFixed(1)}%`}
            tone={mc.tone}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function MudaCalculatorCard() {
  const mc = useMudaCalculator()
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <MudaInputsCard mc={mc} />
      <MudaChartCard mc={mc} />
    </div>
  )
}

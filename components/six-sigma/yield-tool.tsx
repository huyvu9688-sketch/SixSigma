"use client"

import * as React from "react"
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

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
import {
  Result,
  SectionNote,
  ToolLink,
  fmt,
  type Tone,
} from "@/components/calculator-primitives"
import { CellInput, FlowFooter } from "@/components/six-sigma/shared"
import { rolledThroughputYield, toNonNegative } from "@/lib/six-sigma/stats"
import { newId, useSixSigmaProject } from "@/lib/six-sigma/project-store"
import { PlusIcon, XIcon, PercentIcon } from "lucide-react"

type StepRow = {
  id: string
  name: string
  entering: string
  scrap: string
  rework: string
}

const chartConfig = {
  fty: { label: "First time yield", color: "var(--chart-2)" },
  rty: { label: "Rolled throughput yield", color: "var(--chart-4)" },
} satisfies ChartConfig

function seedSteps(names: string[]): StepRow[] {
  // The worked example from the guide: 100 in, 5 scrap + 5 rework, and so on.
  const seed = [
    { entering: "100", scrap: "5", rework: "5" },
    { entering: "95", scrap: "10", rework: "5" },
    { entering: "85", scrap: "5", rework: "15" },
  ]
  const labels =
    names.length >= 2 ? names.slice(0, Math.max(names.length, 3)) : []
  return seed.map((s, i) => ({
    id: `yield-seed-${i + 1}`,
    name: labels[i] ?? `Process ${String.fromCharCode(65 + i)}`,
    ...s,
  }))
}

export function YieldTool() {
  const [project] = useSixSigmaProject()
  const processNames = React.useMemo(
    () => project.sipoc.process.map((s) => s.text).filter(Boolean),
    [project.sipoc.process]
  )
  const [steps, setSteps] = React.useState<StepRow[]>(() =>
    seedSteps(processNames)
  )

  const parsed = steps.map((s) => ({
    entering: toNonNegative(s.entering),
    scrap: toNonNegative(s.scrap),
    rework: toNonNegative(s.rework),
  }))
  const { perStep, overallFty, overallRty } = rolledThroughputYield(parsed)

  const chartData = steps.map((s, i) => ({
    name: s.name || `Step ${i + 1}`,
    fty: perStep[i] ? perStep[i].fty * 100 : 0,
    rty: perStep[i] ? perStep[i].rty * 100 : 0,
  }))

  const totalRework = parsed.reduce((a, s) => a + s.rework, 0)
  const totalScrap = parsed.reduce((a, s) => a + s.scrap, 0)
  const hiddenFactory = overallFty - overallRty
  const rtyTone: Tone =
    overallRty >= 0.95 ? "good" : overallRty >= 0.8 ? "warn" : "bad"

  // A step whose entering count does not match the previous step's good output
  // means the chain is inconsistent; worth flagging rather than silently using.
  const chainWarnings = parsed
    .map((s, i) => {
      if (i === 0) return null
      const expected = parsed[i - 1].entering - parsed[i - 1].scrap
      return Math.abs(expected - s.entering) > 0.001
        ? { index: i, expected }
        : null
    })
    .filter((w): w is { index: number; expected: number } => w !== null)

  const patch = (id: string, changes: Partial<StepRow>) =>
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...changes } : s))
    )

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="@container/card lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PercentIcon className="size-4" />
            Process chain
          </CardTitle>
          <CardDescription>
            One row per process step, in order. Rework is work that was redone
            to make a unit good, which first time yield hides and rolled
            throughput yield exposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table className="min-w-160">
            <TableHeader>
              <TableRow className="text-xs text-muted-foreground">
                <TableHead className="min-w-40">Step</TableHead>
                <TableHead className="w-28">Units in</TableHead>
                <TableHead className="w-28">Scrapped</TableHead>
                <TableHead className="w-28">Reworked</TableHead>
                <TableHead className="w-20">FTY</TableHead>
                <TableHead className="w-20">RTY</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <CellInput
                      label={`Step ${i + 1} name`}
                      value={s.name}
                      placeholder="Step name"
                      onChange={(name) => patch(s.id, { name })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Step ${i + 1} units entering`}
                      value={s.entering}
                      inputMode="decimal"
                      onChange={(entering) => patch(s.id, { entering })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Step ${i + 1} scrapped`}
                      value={s.scrap}
                      inputMode="decimal"
                      onChange={(scrap) => patch(s.id, { scrap })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Step ${i + 1} reworked`}
                      value={s.rework}
                      inputMode="decimal"
                      onChange={(rework) => patch(s.id, { rework })}
                    />
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {perStep[i] ? `${(perStep[i].fty * 100).toFixed(1)}%` : "—"}
                  </TableCell>
                  <TableCell
                    className={
                      perStep[i] && perStep[i].rty < perStep[i].fty
                        ? "text-destructive tabular-nums"
                        : "tabular-nums"
                    }
                  >
                    {perStep[i] ? `${(perStep[i].rty * 100).toFixed(1)}%` : "—"}
                  </TableCell>
                  <TableCell>
                    {steps.length > 1 ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          setSteps((prev) => prev.filter((x) => x.id !== s.id))
                        }
                      >
                        <XIcon className="size-3" />
                        <span className="sr-only">Remove step</span>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-fit gap-1 text-xs"
            onClick={() =>
              setSteps((prev) => [
                ...prev,
                {
                  id: newId("yield"),
                  name: "",
                  entering: String(
                    prev.length > 0
                      ? Math.max(
                          toNonNegative(prev[prev.length - 1].entering) -
                            toNonNegative(prev[prev.length - 1].scrap),
                          0
                        )
                      : 100
                  ),
                  scrap: "0",
                  rework: "0",
                },
              ])
            }
          >
            <PlusIcon className="size-3" />
            Step
          </Button>
          {chainWarnings.length > 0 ? (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Units entering step{chainWarnings.length > 1 ? "s" : ""}{" "}
              {chainWarnings.map((w) => w.index + 1).join(", ")} do not match
              the good output of the previous step (expected{" "}
              {chainWarnings.map((w) => fmt.num(w.expected)).join(", ")}). Check
              the chain before trusting the rolled yield.
            </p>
          ) : null}
          <SectionNote>
            FTY = good units ÷ units entering. RTY = (units entering − (scrap +
            rework)) ÷ units entering, multiplied across every step. RTY is the
            probability a unit gets through the whole chain right the first
            time.
          </SectionNote>
        </CardContent>
      </Card>

      <Card className="@container/card lg:col-span-1">
        <CardHeader>
          <CardTitle>Yield</CardTitle>
          <CardDescription>
            The gap between FTY and RTY is the hidden factory: work the process
            does twice without anyone counting it as a defect.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                interval={0}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                  />
                }
              />
              <Bar
                dataKey="fty"
                name="First time yield"
                fill="var(--color-fty)"
                radius={2}
                barSize={24}
              />
              <Line
                dataKey="rty"
                name="Rolled throughput yield"
                type="monotone"
                stroke="var(--color-rty)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ChartContainer>
          <div className="grid grid-cols-2 gap-3">
            <Result
              label="Overall FTY"
              value={`${(overallFty * 100).toFixed(1)}%`}
            />
            <Result
              label="Overall RTY"
              value={`${(overallRty * 100).toFixed(1)}%`}
              tone={rtyTone}
            />
            <Result
              label="Hidden factory"
              value={`${(hiddenFactory * 100).toFixed(1)} pts`}
              tone={hiddenFactory > 0.02 ? "bad" : "default"}
              hint={`${fmt.num(totalRework)} units reworked`}
            />
            <Result
              label="Scrapped"
              value={fmt.num(totalScrap)}
              hint="units lost outright"
            />
          </div>
          <FlowFooter>
            <ToolLink href="/calculators/six-sigma">Sigma level</ToolLink>
            <ToolLink href="/qc-tools/pareto">Pareto of defects</ToolLink>
          </FlowFooter>
        </CardContent>
      </Card>
    </div>
  )
}

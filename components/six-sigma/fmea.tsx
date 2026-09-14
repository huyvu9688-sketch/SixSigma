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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Result,
  SectionNote,
  SendButton,
  ToolLink,
  fmt,
  type Tone,
} from "@/components/calculator-primitives"
import { CellInput, FlowFooter } from "@/components/six-sigma/shared"
import { toNonNegative } from "@/lib/six-sigma/stats"
import { FISHBONE_CATEGORIES } from "@/lib/six-sigma/constants"
import {
  newId,
  useSixSigmaProject,
  type FmeaRow,
  type Project,
} from "@/lib/six-sigma/project-store"
import { AlertOctagonIcon, PlusIcon, XIcon } from "lucide-react"

const chartConfig = { rpn: { label: "RPN" } } satisfies ChartConfig

/** Ratings are 1–10; anything outside that is clamped so RPN stays meaningful. */
function rating(raw: string) {
  const n = toNonNegative(raw)
  return Math.min(Math.max(Math.round(n), 1), 10)
}

function rpnOf(row: FmeaRow) {
  return rating(row.sev) * rating(row.occ) * rating(row.det)
}

function rpnAfterOf(row: FmeaRow) {
  return rating(row.sevAfter) * rating(row.occAfter) * rating(row.detAfter)
}

/** Common practice: act on anything above 100, and on any severity 9–10. */
function rpnTone(rpn: number, sev: number): Tone {
  if (sev >= 9 || rpn >= 200) return "bad"
  if (rpn >= 100) return "warn"
  return "good"
}

function rpnColor(rpn: number) {
  if (rpn >= 200) return "var(--destructive)"
  if (rpn >= 100) return "var(--chart-4)"
  return "var(--chart-2)"
}

const RATING_SCALES = [
  {
    key: "Severity (SEV)",
    text: "1 = no effect, 5 = minor disruption to production, 10 = endangers a process or a person.",
  },
  {
    key: "Occurrence (OCC)",
    text: "1 = very unlikely, 10 = almost inevitable.",
  },
  {
    key: "Detection (DET)",
    text: "1 = automated detection that rarely fails, 10 = no detection at all.",
  },
]

export function FmeaTool() {
  const [project, update] = useSixSigmaProject()
  const rows = project.fmea
  const setRows = (next: FmeaRow[]) =>
    update((p: Project) => ({ ...p, fmea: next }))
  const patch = (id: string, changes: Partial<FmeaRow>) =>
    setRows(rows.map((r) => (r.id === id ? { ...r, ...changes } : r)))

  const scored = React.useMemo(
    () =>
      rows
        .map((r) => ({
          row: r,
          rpn: rpnOf(r),
          rpnAfter: rpnAfterOf(r),
          sev: rating(r.sev),
        }))
        .sort((a, b) => b.rpn - a.rpn),
    [rows]
  )

  const top = scored[0]
  const totalBefore = scored.reduce((a, s) => a + s.rpn, 0)
  const totalAfter = scored.reduce((a, s) => a + s.rpnAfter, 0)
  const completed = rows.filter((r) => r.completed).length
  // An action that raises or holds the RPN was not an improvement.
  const ineffective = scored.filter(
    (s) => s.row.completed && s.rpnAfter >= s.rpn
  )

  const chartData = scored.slice(0, 8).map((s, i) => ({
    name: s.row.failure || s.row.step || `Mode ${i + 1}`,
    rpn: s.rpn,
  }))

  const causesFromFishbone = FISHBONE_CATEGORIES.flatMap((cat) =>
    project.fishbone.causes[cat]
      .filter((c) => c.text.trim())
      .map((c) => ({ category: cat, text: c.text }))
  )
  const alreadyListed = new Set(rows.map((r) => r.cause.trim().toLowerCase()))
  const importable = causesFromFishbone.filter(
    (c) => !alreadyListed.has(c.text.trim().toLowerCase())
  )

  const importCauses = () =>
    setRows([
      ...rows,
      ...importable.map((c) => ({
        id: newId("fmea"),
        step: "",
        failure: "",
        effect: project.fishbone.effect,
        sev: "5",
        cause: c.text,
        occ: "5",
        control: "",
        det: "5",
        action: "",
        owner: "",
        completed: false,
        sevAfter: "5",
        occAfter: "5",
        detAfter: "5",
      })),
    ])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="@container/card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertOctagonIcon className="size-4" />
              Risk priority
            </CardTitle>
            <CardDescription>
              {top
                ? `${top.row.failure || "The top failure mode"} carries the highest risk at RPN ${top.rpn}. Work the highest RPN first, and treat any severity of 9 or 10 as urgent regardless of its RPN.`
                : "Add failure modes to rank them by risk."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 8, right: 32 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 1000]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="rpn" name="RPN" radius={4} barSize={20}>
                  {chartData.map((d) => (
                    <Cell key={d.name} fill={rpnColor(d.rpn)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Result
                label="Highest RPN"
                value={top ? String(top.rpn) : "—"}
                tone={top ? rpnTone(top.rpn, top.sev) : "default"}
              />
              <Result label="Total RPN now" value={fmt.num(totalBefore)} />
              <Result
                label="Total RPN after actions"
                value={fmt.num(totalAfter)}
                tone={totalAfter < totalBefore ? "good" : "warn"}
              />
              <Result
                label="Actions completed"
                value={`${completed} of ${rows.length}`}
              />
            </div>
            {ineffective.length > 0 ? (
              <p className="text-xs text-destructive">
                {ineffective.length} completed action
                {ineffective.length === 1 ? "" : "s"} did not lower the RPN. The
                guide is explicit here: if the score is the same or higher after
                the change, the change was not a good one and needs another
                attempt.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="@container/card lg:col-span-1">
          <CardHeader>
            <CardTitle>Rating scales</CardTitle>
            <CardDescription>
              RPN = SEV × OCC × DET, each rated 1 to 10, so the range is 1 to
              1,000.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {RATING_SCALES.map((s) => (
              <div key={s.key} className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-semibold">{s.key}</p>
                <p className="text-xs text-muted-foreground">{s.text}</p>
              </div>
            ))}
            {importable.length > 0 ? (
              <SendButton onClick={importCauses}>
                Import {importable.length} cause
                {importable.length === 1 ? "" : "s"} from fishbone
              </SendButton>
            ) : (
              <SectionNote>
                Every cause from the fishbone diagram is already listed here.
              </SectionNote>
            )}
            <FlowFooter>
              <ToolLink href="/qc-tools/cause-effect">Fishbone</ToolLink>
              <ToolLink href="/six-sigma/control-plan">Control plan</ToolLink>
            </FlowFooter>
          </CardContent>
        </Card>
      </div>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Failure Modes and Effects Analysis</CardTitle>
          <CardDescription>
            Columns 1 to 9 are filled in during Measure; the action columns and
            the rescore belong to Improve. Severity rarely changes unless the
            design changes, so most gains come from occurrence and detection.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table className="min-w-300">
            <TableHeader>
              <TableRow className="text-xs text-muted-foreground">
                <TableHead className="min-w-32">Process step</TableHead>
                <TableHead className="min-w-32">Potential failure</TableHead>
                <TableHead className="min-w-32">Effect on customer</TableHead>
                <TableHead className="w-16">SEV</TableHead>
                <TableHead className="min-w-32">Potential cause</TableHead>
                <TableHead className="w-16">OCC</TableHead>
                <TableHead className="min-w-32">Current control</TableHead>
                <TableHead className="w-16">DET</TableHead>
                <TableHead className="w-16">RPN</TableHead>
                <TableHead className="min-w-32">Action</TableHead>
                <TableHead className="min-w-28">Who / when</TableHead>
                <TableHead className="w-14">Done</TableHead>
                <TableHead className="w-16">SEV′</TableHead>
                <TableHead className="w-16">OCC′</TableHead>
                <TableHead className="w-16">DET′</TableHead>
                <TableHead className="w-16">RPN′</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {scored.map(({ row, rpn, rpnAfter, sev }, i) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} process step`}
                      value={row.step}
                      onChange={(step) => patch(row.id, { step })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} potential failure`}
                      value={row.failure}
                      onChange={(failure) => patch(row.id, { failure })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} effect`}
                      value={row.effect}
                      onChange={(effect) => patch(row.id, { effect })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} severity`}
                      value={row.sev}
                      inputMode="numeric"
                      className="w-14"
                      onChange={(sevRaw) => patch(row.id, { sev: sevRaw })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} cause`}
                      value={row.cause}
                      onChange={(cause) => patch(row.id, { cause })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} occurrence`}
                      value={row.occ}
                      inputMode="numeric"
                      className="w-14"
                      onChange={(occ) => patch(row.id, { occ })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} current control`}
                      value={row.control}
                      onChange={(control) => patch(row.id, { control })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} detection`}
                      value={row.det}
                      inputMode="numeric"
                      className="w-14"
                      onChange={(det) => patch(row.id, { det })}
                    />
                  </TableCell>
                  <TableCell
                    className={
                      rpnTone(rpn, sev) === "bad"
                        ? "font-semibold text-destructive tabular-nums"
                        : rpnTone(rpn, sev) === "warn"
                          ? "font-semibold text-yellow-600 tabular-nums dark:text-yellow-400"
                          : "font-semibold tabular-nums"
                    }
                  >
                    {rpn}
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} recommended action`}
                      value={row.action}
                      onChange={(action) => patch(row.id, { action })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} owner and date`}
                      value={row.owner}
                      onChange={(owner) => patch(row.id, { owner })}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      aria-label={`Row ${i + 1} action completed`}
                      checked={row.completed}
                      onCheckedChange={(checked) =>
                        patch(row.id, { completed: checked === true })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} severity after`}
                      value={row.sevAfter}
                      inputMode="numeric"
                      className="w-14"
                      onChange={(sevAfter) => patch(row.id, { sevAfter })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} occurrence after`}
                      value={row.occAfter}
                      inputMode="numeric"
                      className="w-14"
                      onChange={(occAfter) => patch(row.id, { occAfter })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`Row ${i + 1} detection after`}
                      value={row.detAfter}
                      inputMode="numeric"
                      className="w-14"
                      onChange={(detAfter) => patch(row.id, { detAfter })}
                    />
                  </TableCell>
                  <TableCell
                    className={
                      rpnAfter < rpn
                        ? "font-semibold text-green-600 tabular-nums dark:text-green-400"
                        : "font-semibold text-destructive tabular-nums"
                    }
                  >
                    {rpnAfter}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() =>
                        setRows(rows.filter((r) => r.id !== row.id))
                      }
                    >
                      <XIcon className="size-3" />
                      <span className="sr-only">Remove row</span>
                    </Button>
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
              setRows([
                ...rows,
                {
                  id: newId("fmea"),
                  step: "",
                  failure: "",
                  effect: "",
                  sev: "5",
                  cause: "",
                  occ: "5",
                  control: "",
                  det: "5",
                  action: "",
                  owner: "",
                  completed: false,
                  sevAfter: "5",
                  occAfter: "5",
                  detAfter: "5",
                },
              ])
            }
          >
            <PlusIcon className="size-3" />
            Failure mode
          </Button>
          <SectionNote>
            Rows are sorted by current RPN, highest first. Ratings are clamped
            to 1 to 10 because an RPN built from out-of-range scores cannot be
            compared against another row.
          </SectionNote>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Result,
  SectionNote,
  SendButton,
  ToolLink,
} from "@/components/calculator-primitives"
import { CellInput, FlowFooter } from "@/components/six-sigma/shared"
import {
  newId,
  useSixSigmaProject,
  type ControlPlanRow,
  type Project,
} from "@/lib/six-sigma/project-store"
import { ShieldCheckIcon, PlusIcon, XIcon } from "lucide-react"

/** A row is usable by an operator only if all of these are filled in. */
const REQUIRED: (keyof ControlPlanRow)[] = [
  "step",
  "metric",
  "method",
  "sampleSize",
  "frequency",
  "owner",
  "record",
  "reaction",
]

function isComplete(row: ControlPlanRow) {
  const hasLimit = row.lsl.trim() !== "" || row.usl.trim() !== ""
  return hasLimit && REQUIRED.every((k) => String(row[k]).trim() !== "")
}

function missingFields(row: ControlPlanRow) {
  const missing = REQUIRED.filter((k) => String(row[k]).trim() === "")
  if (row.lsl.trim() === "" && row.usl.trim() === "") missing.push("lsl")
  return missing
}

export function ControlPlanTool() {
  const [project, update] = useSixSigmaProject()
  const rows = project.controlPlan
  const setRows = (next: ControlPlanRow[]) =>
    update((p: Project) => ({ ...p, controlPlan: next }))
  const patch = (id: string, changes: Partial<ControlPlanRow>) =>
    setRows(rows.map((r) => (r.id === id ? { ...r, ...changes } : r)))

  const complete = rows.filter(isComplete).length

  // CTQs that nothing in the plan monitors: the gap that lets a gain slip back.
  const monitored = new Set(
    rows.map((r) => r.metric.trim().toLowerCase()).filter(Boolean)
  )
  const unmonitoredCtqs = project.charter.ctqs.filter(
    (c) =>
      c.requirement.trim() !== "" &&
      !monitored.has(c.requirement.trim().toLowerCase())
  )

  const addFromCtqs = () =>
    setRows([
      ...rows,
      ...unmonitoredCtqs.map((c) => ({
        id: newId("cp"),
        step: "",
        metric: c.requirement,
        lsl: c.lsl,
        usl: c.usl,
        unit: c.unit,
        method: "",
        sampleSize: "",
        frequency: "",
        owner: "",
        record: "",
        reaction: "",
      })),
    ])

  return (
    <div className="flex flex-col gap-4">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4" />
            Control plan
          </CardTitle>
          <CardDescription>
            The document you hand to the process owner. It tells the people
            running the line when to measure, how, what range is acceptable, and
            exactly what to do when a reading falls outside it. {complete} of{" "}
            {rows.length} rows are complete enough to act on.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Result
              label="Process"
              value={
                project.sipoc.process.length > 0
                  ? String(project.sipoc.process.length)
                  : "—"
              }
              hint="steps in the SIPOC"
            />
            <Result
              label="CTQs defined"
              value={String(project.charter.ctqs.length)}
            />
            <Result
              label="CTQs monitored"
              value={`${project.charter.ctqs.length - unmonitoredCtqs.length} of ${project.charter.ctqs.length}`}
              tone={unmonitoredCtqs.length === 0 ? "good" : "warn"}
            />
            <Result
              label="Rows ready"
              value={`${complete} of ${rows.length}`}
              tone={
                complete === rows.length && rows.length > 0 ? "good" : "warn"
              }
            />
          </div>
          {unmonitoredCtqs.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-yellow-600/40 bg-yellow-600/5 p-3 dark:border-yellow-400/40">
              <span className="text-xs text-yellow-700 dark:text-yellow-400">
                {unmonitoredCtqs.length} CTQ
                {unmonitoredCtqs.length === 1 ? "" : "s"} have no monitor in
                this plan:{" "}
                {unmonitoredCtqs.map((c) => c.requirement).join(", ")}
              </span>
              <SendButton onClick={addFromCtqs}>Add rows for them</SendButton>
            </div>
          ) : null}

          <Table className="min-w-300">
            <TableHeader>
              <TableRow className="text-xs text-muted-foreground">
                <TableHead className="min-w-32">Process step</TableHead>
                <TableHead className="min-w-32">CTQ / metric</TableHead>
                <TableHead className="w-20">LSL</TableHead>
                <TableHead className="w-20">USL</TableHead>
                <TableHead className="w-20">Unit</TableHead>
                <TableHead className="min-w-36">Measurement method</TableHead>
                <TableHead className="w-28">Sample size</TableHead>
                <TableHead className="w-28">Frequency</TableHead>
                <TableHead className="w-28">Who measures</TableHead>
                <TableHead className="w-28">Recorded in</TableHead>
                <TableHead className="min-w-56">
                  Corrective action when out of range
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const missing = missingFields(row)
                return (
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
                        label={`Row ${i + 1} metric`}
                        value={row.metric}
                        onChange={(metric) => patch(row.id, { metric })}
                      />
                    </TableCell>
                    <TableCell>
                      <CellInput
                        label={`Row ${i + 1} lower limit`}
                        value={row.lsl}
                        inputMode="decimal"
                        onChange={(lsl) => patch(row.id, { lsl })}
                      />
                    </TableCell>
                    <TableCell>
                      <CellInput
                        label={`Row ${i + 1} upper limit`}
                        value={row.usl}
                        inputMode="decimal"
                        onChange={(usl) => patch(row.id, { usl })}
                      />
                    </TableCell>
                    <TableCell>
                      <CellInput
                        label={`Row ${i + 1} unit`}
                        value={row.unit}
                        onChange={(unit) => patch(row.id, { unit })}
                      />
                    </TableCell>
                    <TableCell>
                      <CellInput
                        label={`Row ${i + 1} method`}
                        value={row.method}
                        onChange={(method) => patch(row.id, { method })}
                      />
                    </TableCell>
                    <TableCell>
                      <CellInput
                        label={`Row ${i + 1} sample size`}
                        value={row.sampleSize}
                        onChange={(sampleSize) => patch(row.id, { sampleSize })}
                      />
                    </TableCell>
                    <TableCell>
                      <CellInput
                        label={`Row ${i + 1} frequency`}
                        value={row.frequency}
                        onChange={(frequency) => patch(row.id, { frequency })}
                      />
                    </TableCell>
                    <TableCell>
                      <CellInput
                        label={`Row ${i + 1} owner`}
                        value={row.owner}
                        onChange={(owner) => patch(row.id, { owner })}
                      />
                    </TableCell>
                    <TableCell>
                      <CellInput
                        label={`Row ${i + 1} record location`}
                        value={row.record}
                        onChange={(record) => patch(row.id, { record })}
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        aria-label={`Row ${i + 1} corrective action`}
                        value={row.reaction}
                        rows={3}
                        onChange={(e) =>
                          patch(row.id, { reaction: e.target.value })
                        }
                        className="min-h-16 text-sm"
                      />
                      {missing.length > 0 ? (
                        <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                          Missing: {missing.join(", ")}
                        </p>
                      ) : null}
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
                )
              })}
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
                  id: newId("cp"),
                  step: "",
                  metric: "",
                  lsl: "",
                  usl: "",
                  unit: project.spec.unit,
                  method: "",
                  sampleSize: "",
                  frequency: "",
                  owner: "",
                  record: "",
                  reaction: "",
                },
              ])
            }
          >
            <PlusIcon className="size-3" />
            Control point
          </Button>
          <SectionNote>
            A corrective action needs to say what to do with the parts already
            made, not only how to fix the machine. Name the specific gauge or
            tool: if two operators measure the same thing different ways, the
            plan is measuring two processes. Automated data collection does not
            remove the need for a plan, it only changes who records the reading.
          </SectionNote>
          <FlowFooter label="Keeps the gain from">
            <ToolLink href="/qc-tools/control-chart">Control chart</ToolLink>
            <ToolLink href="/six-sigma/attribute-chart">
              Attribute charts
            </ToolLink>
            <ToolLink href="/six-sigma/fmea">FMEA rescore</ToolLink>
          </FlowFooter>
        </CardContent>
      </Card>
    </div>
  )
}

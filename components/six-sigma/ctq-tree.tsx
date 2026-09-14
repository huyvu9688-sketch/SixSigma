"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SectionNote, ToolLink } from "@/components/calculator-primitives"
import { CellInput, FlowFooter } from "@/components/six-sigma/shared"
import {
  newId,
  useSixSigmaProject,
  type Ctq,
  type Project,
} from "@/lib/six-sigma/project-store"
import { GitForkIcon, PlusIcon, XIcon } from "lucide-react"

/** Is this requirement measurable? A unit plus at least one limit. */
function isMeasurable(ctq: Ctq) {
  const hasLimit =
    (ctq.lsl.trim() !== "" && Number.isFinite(Number(ctq.lsl))) ||
    (ctq.usl.trim() !== "" && Number.isFinite(Number(ctq.usl)))
  return ctq.unit.trim() !== "" && hasLimit
}

function TreeDiagram({ ctqs, need }: { ctqs: Ctq[]; need: string }) {
  const rows = ctqs.filter((c) => c.driver.trim() || c.requirement.trim())
  if (rows.length === 0) return null
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-center gap-3">
        <div className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-xs font-medium">
          {need || "Customer need"}
        </div>
        <span aria-hidden className="text-muted-foreground">
          →
        </span>
        <div className="flex flex-col gap-2">
          {rows.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <div className="w-48 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs">
                {c.driver || "Driver"}
              </div>
              <span aria-hidden className="text-muted-foreground">
                →
              </span>
              <div
                className={
                  isMeasurable(c)
                    ? "rounded-lg border border-green-600/40 bg-green-600/5 px-3 py-1.5 text-xs dark:border-green-400/40"
                    : "rounded-lg border border-dashed px-3 py-1.5 text-xs text-muted-foreground"
                }
              >
                {c.requirement || "Requirement"}
                {c.unit ? ` (${c.unit})` : ""}
                {c.lsl || c.usl
                  ? ` · ${c.lsl || "—"} to ${c.usl || "—"}`
                  : " · no limits set"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CtqTreeTool() {
  const [project, update] = useSixSigmaProject()
  const { ctqs } = project.charter
  const setCtqs = (next: Ctq[]) =>
    update((p: Project) => ({
      ...p,
      charter: { ...p.charter, ctqs: next },
    }))
  const patch = (id: string, changes: Partial<Ctq>) =>
    setCtqs(ctqs.map((c) => (c.id === id ? { ...c, ...changes } : c)))

  const measurable = ctqs.filter(isMeasurable).length

  return (
    <div className="flex flex-col gap-4">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitForkIcon className="size-4" />
            Critical to Quality (CTQ) Tree
          </CardTitle>
          <CardDescription>
            Turn what the customer says into something you can measure: need →
            driver → measurable requirement with limits. {measurable} of{" "}
            {ctqs.length} requirements are measurable.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TreeDiagram ctqs={ctqs} need={ctqs[0]?.need ?? ""} />
          <Table className="min-w-200">
            <TableHeader>
              <TableRow className="text-xs text-muted-foreground">
                <TableHead className="min-w-40">Customer need (VoC)</TableHead>
                <TableHead className="min-w-40">Driver</TableHead>
                <TableHead className="min-w-40">
                  Requirement (measure)
                </TableHead>
                <TableHead className="w-24">Unit</TableHead>
                <TableHead className="w-24">LSL</TableHead>
                <TableHead className="w-24">USL</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ctqs.map((c, i) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <CellInput
                      label={`CTQ ${i + 1} need`}
                      value={c.need}
                      placeholder="What the customer said"
                      onChange={(need) => patch(c.id, { need })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`CTQ ${i + 1} driver`}
                      value={c.driver}
                      placeholder="What drives it"
                      onChange={(driver) => patch(c.id, { driver })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`CTQ ${i + 1} requirement`}
                      value={c.requirement}
                      placeholder="What you measure"
                      onChange={(requirement) => patch(c.id, { requirement })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`CTQ ${i + 1} unit`}
                      value={c.unit}
                      placeholder="mm"
                      onChange={(unit) => patch(c.id, { unit })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`CTQ ${i + 1} lower spec limit`}
                      value={c.lsl}
                      inputMode="decimal"
                      onChange={(lsl) => patch(c.id, { lsl })}
                    />
                  </TableCell>
                  <TableCell>
                    <CellInput
                      label={`CTQ ${i + 1} upper spec limit`}
                      value={c.usl}
                      inputMode="decimal"
                      onChange={(usl) => patch(c.id, { usl })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setCtqs(ctqs.filter((x) => x.id !== c.id))}
                    >
                      <XIcon className="size-3" />
                      <span className="sr-only">Remove CTQ</span>
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
              setCtqs([
                ...ctqs,
                {
                  id: newId("ctq"),
                  need: "",
                  driver: "",
                  requirement: "",
                  unit: "",
                  lsl: "",
                  usl: "",
                },
              ])
            }
          >
            <PlusIcon className="size-3" />
            CTQ
          </Button>
          <SectionNote>
            A requirement without a unit and at least one spec limit cannot be
            charted or judged capable, so it is not finished. Test each one by
            asking: if this is met, will the customer be satisfied?
          </SectionNote>
          <FlowFooter>
            <ToolLink href="/six-sigma/capability">
              Capability against these limits
            </ToolLink>
            <ToolLink href="/six-sigma/control-plan">
              Control plan for each CTQ
            </ToolLink>
          </FlowFooter>
        </CardContent>
      </Card>
    </div>
  )
}

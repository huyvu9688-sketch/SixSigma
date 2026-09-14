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
import {
  Field,
  Result,
  SectionNote,
  ToolLink,
  fmt,
  type Tone,
} from "@/components/calculator-primitives"
import { FlowFooter } from "@/components/six-sigma/shared"
import {
  dpmo as dpmoOf,
  dpmoFromSigma,
  sigmaFromDpmo,
} from "@/lib/six-sigma/stats"
import { REFERENCE_SIGMA_LEVELS } from "@/lib/six-sigma/constants"
import {
  defectRateNumbers,
  useSixSigmaProject,
  type DefectRateInput,
  type Project,
} from "@/lib/six-sigma/project-store"
import { SigmaIcon, TableIcon, TrendingDownIcon } from "lucide-react"

function sigmaTone(sigma: number): Tone {
  return sigma >= 5 ? "good" : sigma >= 3.5 ? "warn" : "bad"
}

/** DPMO, yield, DPU and sigma level for one set of defect-rate inputs. */
export function summarize(input: DefectRateInput) {
  const { units, opportunities, defects, costPerDefect, hasData } =
    defectRateNumbers(input)
  const totalOpportunities = units * opportunities
  const dpmo = hasData ? dpmoOf(defects, units, opportunities) : 0
  const yieldPct = hasData
    ? Math.max(1 - defects / totalOpportunities, 0) * 100
    : 0
  const dpu = units > 0 ? defects / units : 0
  const sigmaLevel = hasData ? sigmaFromDpmo(dpmo) : 0
  return {
    hasData,
    units,
    opportunities,
    defects,
    costPerDefect,
    totalOpportunities,
    dpmo,
    yieldPct,
    dpu,
    sigmaLevel,
    cost: defects * costPerDefect,
    tone: sigmaTone(sigmaLevel),
  }
}

function DefectRateFields({
  prefix,
  value,
  onChange,
}: {
  prefix: string
  value: DefectRateInput
  onChange: (patch: Partial<DefectRateInput>) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field
        id={`${prefix}-units`}
        label="Units produced"
        className="col-span-2"
        raw={value.units}
        setRaw={(units) => onChange({ units })}
      />
      <Field
        id={`${prefix}-opportunities`}
        label="Opportunities / unit"
        raw={value.opportunities}
        setRaw={(opportunities) => onChange({ opportunities })}
      />
      <Field
        id={`${prefix}-defects`}
        label="Defects found"
        raw={value.defects}
        setRaw={(defects) => onChange({ defects })}
      />
      <Field
        id={`${prefix}-cost`}
        label="Cost per defect"
        suffix="$"
        className="col-span-2"
        raw={value.costPerDefect}
        setRaw={(costPerDefect) => onChange({ costPerDefect })}
      />
    </div>
  )
}

function BaselineCard({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  return (
    <Card className="@container/card lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SigmaIcon className="size-4" />
          Baseline (before)
        </CardTitle>
        <CardDescription>
          Current process performance. This is the project baseline every other
          phase is measured against.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <DefectRateFields
          prefix="ss-base"
          value={project.baseline}
          onChange={(patch) =>
            update((p) => ({ ...p, baseline: { ...p.baseline, ...patch } }))
          }
        />
        <SectionNote>
          DPMO = defects ÷ (units × opportunities per unit) × 1,000,000. Sigma
          level is solved from DPMO using the standard 1.5σ long-term shift, so
          6σ = 3.4 DPMO.
        </SectionNote>
      </CardContent>
    </Card>
  )
}

function AfterCard({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  return (
    <Card className="@container/card lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDownIcon className="size-4" />
          After improvement
        </CardTitle>
        <CardDescription>
          Fill this in once the improvement is running to prove the gain. Leave
          it blank during Define and Measure.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <DefectRateFields
          prefix="ss-after"
          value={project.improved}
          onChange={(patch) =>
            update((p) => ({ ...p, improved: { ...p.improved, ...patch } }))
          }
        />
        <SectionNote>
          Measure the after-state over a comparable run length. Comparing a good
          week against a bad month proves nothing.
        </SectionNote>
      </CardContent>
    </Card>
  )
}

function ResultsCard({ project }: { project: Project }) {
  const before = summarize(project.baseline)
  const after = summarize(project.improved)
  const sigmaGain = after.hasData ? after.sigmaLevel - before.sigmaLevel : 0
  const costSaved = after.hasData ? before.cost - after.cost : 0

  return (
    <Card className="@container/card lg:col-span-1">
      <CardHeader>
        <CardTitle>Result</CardTitle>
        <CardDescription>
          {before.hasData
            ? `${fmt.num(before.totalOpportunities)} opportunities inspected in the baseline`
            : "Enter units and opportunities per unit to calculate a sigma level"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Result
            label="DPMO"
            value={before.hasData ? fmt.num(before.dpmo) : "—"}
          />
          <Result
            label="Sigma level"
            value={before.hasData ? `${before.sigmaLevel.toFixed(2)}σ` : "—"}
            tone={before.hasData ? before.tone : "default"}
          />
          <Result
            label="Yield"
            value={before.hasData ? `${before.yieldPct.toFixed(2)}%` : "—"}
          />
          <Result
            label="DPU"
            value={before.units > 0 ? before.dpu.toFixed(3) : "—"}
            hint="defects per unit"
          />
          <Result
            label="Cost of defects"
            value={before.hasData ? fmt.money(before.cost) : "—"}
            tone={before.hasData ? before.tone : "default"}
          />
          <Result
            label="Sigma gain"
            value={
              after.hasData
                ? `${sigmaGain >= 0 ? "+" : ""}${sigmaGain.toFixed(2)}σ`
                : "—"
            }
            tone={after.hasData ? (sigmaGain > 0 ? "good" : "bad") : "default"}
            hint={
              after.hasData
                ? `${costSaved >= 0 ? "saves" : "costs"} ${fmt.money(Math.abs(costSaved))}`
                : "fill in the after-state"
            }
          />
        </div>
        <FlowFooter>
          <ToolLink href="/six-sigma/capability">Capability</ToolLink>
          <ToolLink href="/six-sigma/cost-of-quality">Cost of quality</ToolLink>
          <ToolLink href="/six-sigma">Project hub</ToolLink>
        </FlowFooter>
      </CardContent>
    </Card>
  )
}

function ReferenceTableCard({ project }: { project: Project }) {
  const before = summarize(project.baseline)
  const rows = REFERENCE_SIGMA_LEVELS.map((sigma) => {
    const rowDpmo = dpmoFromSigma(sigma)
    const estDefects = before.hasData
      ? (rowDpmo / 1e6) * before.totalOpportunities
      : 0
    return {
      sigma,
      dpmo: rowDpmo,
      estDefects,
      estCost: estDefects * before.costPerDefect,
    }
  })
  // Nearest reference row to the current sigma level, computed once rather than
  // rescanning the table for every row.
  const closestSigma = before.hasData
    ? rows.reduce((best, r) =>
        Math.abs(r.sigma - before.sigmaLevel) <
        Math.abs(best.sigma - before.sigmaLevel)
          ? r
          : best
      ).sigma
    : null

  return (
    <Card className="@container/card lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="size-4" />
          Sigma Level Reference Table
        </CardTitle>
        <CardDescription>
          Defects and cost you would expect at your own volume
          {before.hasData
            ? ` (${fmt.num(before.totalOpportunities)} opportunities)`
            : ""}{" "}
          if the process ran at each sigma level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table className="min-w-130">
          <TableHeader>
            <TableRow className="text-xs text-muted-foreground">
              <TableHead>Sigma level</TableHead>
              <TableHead>DPMO</TableHead>
              <TableHead>Est. defects</TableHead>
              <TableHead>Est. cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isClosest = row.sigma === closestSigma
              return (
                <TableRow
                  key={row.sigma}
                  className={isClosest ? "bg-muted/40 font-medium" : ""}
                >
                  <TableCell className="tabular-nums">
                    {row.sigma}σ
                    {isClosest ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ← you are here
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {fmt.num(row.dpmo, 1)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {before.hasData ? fmt.num(row.estDefects) : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {before.hasData ? fmt.money(row.estCost) : "—"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function SigmaLevelTool() {
  const [project, update] = useSixSigmaProject()
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <BaselineCard project={project} update={update} />
      <AfterCard project={project} update={update} />
      <ResultsCard project={project} />
      <ReferenceTableCard project={project} />
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { ProgressTrack, ProgressIndicator } from "@/components/ui/progress"
import {
  Result,
  SectionNote,
  TextField,
  fmt,
  type Tone,
} from "@/components/calculator-primitives"
import { summarize } from "@/components/six-sigma/sigma-level"
import {
  capability,
  imrLimits,
  nelsonTests,
  pareto,
  parseNumberList,
  stdDev,
  toNonNegative,
  toNumber,
} from "@/lib/six-sigma/stats"
import {
  DMAIC_PHASES,
  DMAIC_PHASE_LABELS,
  type DmaicPhase,
} from "@/lib/six-sigma/constants"
import {
  TOLLGATE_ITEMS,
  resetProject,
  useSixSigmaProject,
  type Project,
} from "@/lib/six-sigma/project-store"
import {
  ArrowRightIcon,
  RotateCcwIcon,
  CheckIcon,
  CircleDotIcon,
} from "lucide-react"

type ToolEntry = { href: string; name: string; purpose: string }

const TOOL_MAP: Record<DmaicPhase, ToolEntry[]> = {
  define: [
    {
      href: "/six-sigma/charter",
      name: "Project charter",
      purpose: "Problem statement, goal, scope, team, schedule",
    },
    {
      href: "/six-sigma/sipoc",
      name: "SIPOC",
      purpose: "Agree what the process is and where it starts and ends",
    },
    {
      href: "/six-sigma/ctq",
      name: "CTQ tree",
      purpose: "Turn what the customer wants into measurable limits",
    },
    {
      href: "/six-sigma/cost-of-quality",
      name: "Cost of quality",
      purpose: "Put a number on what poor quality is costing",
    },
  ],
  measure: [
    {
      href: "/calculators/six-sigma",
      name: "Sigma level & DPMO",
      purpose: "The baseline everything else is compared against",
    },
    {
      href: "/six-sigma/yield",
      name: "Yield (FTY / RTY)",
      purpose: "Expose rework the yield figure hides",
    },
    {
      href: "/six-sigma/gage-rr",
      name: "Gage R&R",
      purpose: "Prove the measurement system before trusting its data",
    },
    {
      href: "/six-sigma/sample-size",
      name: "Sample size",
      purpose: "How much data the conclusion actually needs",
    },
    {
      href: "/qc-tools/check-sheet",
      name: "Check sheet",
      purpose: "Tally defects by category and shift as they happen",
    },
    {
      href: "/six-sigma/capability",
      name: "Capability (Cp / Cpk)",
      purpose: "Compare the spread against the customer's limits",
    },
    {
      href: "/six-sigma/fmea",
      name: "FMEA",
      purpose: "Rank failure modes by risk before guessing at causes",
    },
  ],
  analyze: [
    {
      href: "/qc-tools/pareto",
      name: "Pareto",
      purpose: "Find the few categories causing most of the problem",
    },
    {
      href: "/qc-tools/histogram",
      name: "Histogram",
      purpose: "See the shape and spread of the measurements",
    },
    {
      href: "/calculators/root-cause",
      name: "5 Whys & fishbone",
      purpose: "Get from symptom to a process-level cause",
    },
    {
      href: "/qc-tools/scatter",
      name: "Scatter diagram",
      purpose: "Test whether two variables actually move together",
    },
    {
      href: "/six-sigma/hypothesis-test",
      name: "Hypothesis test",
      purpose: "Decide whether a difference is real or noise",
    },
  ],
  improve: [
    {
      href: "/qc-tools/gantt",
      name: "Implementation plan",
      purpose: "Schedule and track the changes",
    },
    {
      href: "/six-sigma/fmea",
      name: "FMEA rescore",
      purpose: "Prove the action lowered the risk",
    },
    {
      href: "/calculators/vsm",
      name: "Value stream map",
      purpose: "Remove wait and motion from the flow",
    },
    {
      href: "/calculators/muda",
      name: "Muda (8 wastes)",
      purpose: "Price the waste each category is costing",
    },
    {
      href: "/calculators/balance",
      name: "Takt & line balance",
      purpose: "Match the line to demand once the defects are gone",
    },
  ],
  control: [
    {
      href: "/qc-tools/control-chart",
      name: "Control chart (I-MR, X̄-R)",
      purpose: "Watch measured data for special causes",
    },
    {
      href: "/six-sigma/attribute-chart",
      name: "Attribute charts (p, np, c, u)",
      purpose: "Watch pass/fail and defect-count data",
    },
    {
      href: "/six-sigma/control-plan",
      name: "Control plan",
      purpose: "Hand the process back with a monitor and a reaction plan",
    },
    {
      href: "/calculators/oee",
      name: "OEE",
      purpose: "Keep an eye on availability, speed and quality together",
    },
  ],
}

function PhaseStepper({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  const currentIndex = DMAIC_PHASES.indexOf(project.phase)
  return (
    <div className="flex flex-wrap gap-2">
      {DMAIC_PHASES.map((phase, i) => {
        const done = project.tollgates[phase].every(Boolean)
        const isCurrent = phase === project.phase
        return (
          <Button
            key={phase}
            variant={isCurrent ? "default" : done ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => update((p) => ({ ...p, phase }))}
          >
            {done ? (
              <CheckIcon className="size-3" />
            ) : isCurrent ? (
              <CircleDotIcon className="size-3" />
            ) : (
              <span className="text-xs tabular-nums">{i + 1}</span>
            )}
            {DMAIC_PHASE_LABELS[phase]}
            {i < currentIndex && !done ? (
              <span className="text-xs opacity-70">open</span>
            ) : null}
          </Button>
        )
      })}
    </div>
  )
}

function OverviewCard({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  const before = summarize(project.baseline)
  const after = summarize(project.improved)
  const totalGates = DMAIC_PHASES.reduce(
    (a, phase) => a + project.tollgates[phase].length,
    0
  )
  const passedGates = DMAIC_PHASES.reduce(
    (a, phase) => a + project.tollgates[phase].filter(Boolean).length,
    0
  )
  const completion = totalGates > 0 ? (passedGates / totalGates) * 100 : 0

  return (
    <Card className="@container/card lg:col-span-2">
      <CardHeader>
        <CardTitle>DMAIC project</CardTitle>
        <CardDescription>
          Every tool in this app reads and writes this one project, so the
          output of one phase is the input to the next. It is stored in this
          browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <TextField
          id="hub-name"
          label="Project name"
          value={project.name}
          onChange={(name) => update((p) => ({ ...p, name }))}
        />
        <PhaseStepper project={project} update={update} />
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Tollgate items passed
            </span>
            <span className="text-xs font-medium tabular-nums">
              {passedGates} of {totalGates}
            </span>
          </div>
          <ProgressPrimitive.Root value={completion}>
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </ProgressPrimitive.Root>
        </div>
        <p className="text-sm">
          {project.charter.problem || "No problem statement yet."}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Result
            label="Baseline sigma"
            value={before.hasData ? `${before.sigmaLevel.toFixed(2)}σ` : "—"}
            tone={before.hasData ? before.tone : "default"}
            hint={
              before.hasData ? `${fmt.num(before.dpmo)} DPMO` : "set a baseline"
            }
          />
          <Result
            label="Current sigma"
            value={after.hasData ? `${after.sigmaLevel.toFixed(2)}σ` : "—"}
            tone={after.hasData ? after.tone : "default"}
            hint={
              after.hasData
                ? `${fmt.num(after.dpmo)} DPMO`
                : "after improvement"
            }
          />
          <Result
            label="Defect cost"
            value={before.hasData ? fmt.money(before.cost) : "—"}
            tone={before.hasData ? "bad" : "default"}
            hint="at baseline"
          />
          <Result
            label="Saving so far"
            value={after.hasData ? fmt.money(before.cost - after.cost) : "—"}
            tone={
              after.hasData
                ? before.cost - after.cost > 0
                  ? "good"
                  : "bad"
                : "default"
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SignalsCard({ project }: { project: Project }) {
  const values = parseNumberList(project.measurementsRaw)
  const sd = stdDev(values)
  const m =
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  const cap = capability({
    usl: toNumber(project.spec.usl),
    lsl: toNumber(project.spec.lsl),
    mean: m,
    stdDev: sd,
  })
  const imr = values.length > 1 ? imrLimits(values) : null
  const signals =
    imr && imr.sigma > 0 ? nelsonTests(values, imr.mean, imr.sigma).length : 0

  const paretoResult = pareto(
    project.defectCategories.map((c) => ({
      name: c.name,
      count: toNonNegative(c.count),
    }))
  )
  const topCategory = paretoResult.rows[0]

  const topRpn = project.fmea.reduce((max, r) => {
    const rpn =
      Math.min(Math.max(Math.round(toNonNegative(r.sev)), 1), 10) *
      Math.min(Math.max(Math.round(toNonNegative(r.occ)), 1), 10) *
      Math.min(Math.max(Math.round(toNonNegative(r.det)), 1), 10)
    return Math.max(max, rpn)
  }, 0)

  const cpkTone: Tone =
    !cap.hasSpread || values.length < 2
      ? "default"
      : cap.cpk >= 1.33
        ? "good"
        : cap.cpk >= 1
          ? "warn"
          : "bad"

  return (
    <Card className="@container/card lg:col-span-1">
      <CardHeader>
        <CardTitle>Live signals</CardTitle>
        <CardDescription>
          Pulled from the data already entered in the tools.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Result
          label="Cpk"
          value={values.length > 1 && cap.hasSpread ? cap.cpk.toFixed(2) : "—"}
          tone={cpkTone}
          hint={`n = ${values.length}`}
        />
        <Result
          label="In control?"
          value={imr ? (signals === 0 ? "Yes" : `${signals} signals`) : "—"}
          tone={imr ? (signals === 0 ? "good" : "bad") : "default"}
          hint="I-MR, eight tests"
        />
        <Result
          label="Top defect"
          value={topCategory?.name ?? "—"}
          tone={topCategory ? "bad" : "default"}
          hint={
            topCategory
              ? `${topCategory.pct.toFixed(0)}% of ${fmt.num(paretoResult.total)}`
              : "no categories"
          }
        />
        <Result
          label="Vital few"
          value={
            paretoResult.rows.length > 0
              ? `${paretoResult.vitalFewCount} of ${paretoResult.rows.length}`
              : "—"
          }
          hint="reach 80% of defects"
        />
        <Result
          label="Highest RPN"
          value={topRpn > 0 ? String(topRpn) : "—"}
          tone={topRpn >= 200 ? "bad" : topRpn >= 100 ? "warn" : "good"}
          hint={`${project.fmea.length} failure modes`}
        />
        <Result
          label="Control points"
          value={String(project.controlPlan.length)}
          hint="in the control plan"
        />
      </CardContent>
    </Card>
  )
}

function TollgateCard({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  const toggle = (phase: DmaicPhase, index: number, checked: boolean) =>
    update((p) => ({
      ...p,
      tollgates: {
        ...p.tollgates,
        [phase]: p.tollgates[phase].map((v, i) => (i === index ? checked : v)),
      },
    }))

  return (
    <Card className="@container/card lg:col-span-3">
      <CardHeader>
        <CardTitle>Tollgates</CardTitle>
        <CardDescription>
          What has to be true before a phase is finished. The phases are not
          hard borders, but leaving one with an unchecked item is how projects
          end up solving the wrong problem.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {DMAIC_PHASES.map((phase) => {
          const items = TOLLGATE_ITEMS[phase]
          const checks = project.tollgates[phase]
          const done = checks.filter(Boolean).length
          return (
            <div
              key={phase}
              className={
                phase === project.phase
                  ? "flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3"
                  : "flex flex-col gap-2 rounded-lg border bg-muted/30 p-3"
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {DMAIC_PHASE_LABELS[phase]}
                </span>
                <Badge variant={done === items.length ? "default" : "outline"}>
                  {done}/{items.length}
                </Badge>
              </div>
              {items.map((item, i) => (
                <div key={item} className="flex items-start gap-2">
                  <Checkbox
                    id={`gate-${phase}-${i}`}
                    className="mt-0.5"
                    checked={checks[i] ?? false}
                    onCheckedChange={(checked) =>
                      toggle(phase, i, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`gate-${phase}-${i}`}
                    className="text-xs leading-snug font-normal text-muted-foreground"
                  >
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ToolMapCard({ project }: { project: Project }) {
  const [confirming, setConfirming] = React.useState(false)
  return (
    <Card className="@container/card lg:col-span-3">
      <CardHeader>
        <CardTitle>Tools by phase</CardTitle>
        <CardDescription>
          Each tool states what it is for. Working them in order is what makes
          this a system rather than a folder of calculators.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {DMAIC_PHASES.map((phase) => (
            <div key={phase} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {DMAIC_PHASE_LABELS[phase]}
                </span>
                {phase === project.phase ? (
                  <Badge variant="secondary">current</Badge>
                ) : null}
              </div>
              {TOOL_MAP[phase].map((tool) => (
                <Link
                  key={`${phase}-${tool.href}`}
                  href={tool.href}
                  className="group flex flex-col gap-0.5 rounded-lg border bg-muted/20 p-2.5 transition-colors hover:bg-accent"
                >
                  <span className="flex items-center gap-1 text-xs font-medium">
                    {tool.name}
                    <ArrowRightIcon className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {tool.purpose}
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <SectionNote className="flex-1">
            The project lives in this browser only. Clearing site data or
            opening the app elsewhere starts from the seeded example again.
          </SectionNote>
          {confirming ? (
            <>
              <span className="text-xs text-destructive">
                Discard all entered data?
              </span>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  resetProject()
                  setConfirming(false)
                }}
              >
                Reset project
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setConfirming(false)}
              >
                Keep it
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setConfirming(true)}
            >
              <RotateCcwIcon className="size-3" />
              Reset to example
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function SixSigmaHub() {
  const [project, update] = useSixSigmaProject()
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <OverviewCard project={project} update={update} />
      <SignalsCard project={project} />
      <TollgateCard project={project} update={update} />
      <ToolMapCard project={project} />
    </div>
  )
}

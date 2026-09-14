"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Result,
  SectionNote,
  SendButton,
  ToolLink,
} from "@/components/calculator-primitives"
import { EditableTextList, FlowFooter } from "@/components/six-sigma/shared"
import {
  newId,
  useSixSigmaProject,
  type IdText,
  type Project,
} from "@/lib/six-sigma/project-store"
import {
  FISHBONE_CATEGORIES,
  type FishboneCategory,
} from "@/lib/six-sigma/constants"
import { GitBranchIcon, FishIcon } from "lucide-react"

// --- 5 Whys -------------------------------------------------------------

/**
 * A cause is process-level when it names a system that failed rather than a
 * person or a part. Stopping at "the bearing wore out" fixes one bearing;
 * stopping at "the asset is not on the PM schedule" fixes the class.
 */
const PROCESS_LEVEL_HINTS =
  /\b(schedule|standard|procedure|sop|training|spec|specification|system|process|policy|checklist|plan|instruction|design|cmms|not assigned|no one|never (set|added|defined))\b/i

function FiveWhysCard({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  const { fiveWhys } = project
  const filled = fiveWhys.whys.filter((w) => w.text.trim())
  const rootCause = filled.at(-1)?.text ?? ""
  const processLevel = PROCESS_LEVEL_HINTS.test(rootCause)

  return (
    <Card className="@container/card lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranchIcon className="size-4" />5 Whys
        </CardTitle>
        <CardDescription>
          Ask why until the answer names a process that failed, not a person or
          a worn part. Five is a guideline, not a rule.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rca-problem">Problem statement</Label>
          <Input
            id="rca-problem"
            value={fiveWhys.problem}
            onChange={(e) =>
              update((p) => ({
                ...p,
                fiveWhys: { ...p.fiveWhys, problem: e.target.value },
              }))
            }
          />
        </div>
        <EditableTextList
          items={fiveWhys.whys}
          onChange={(whys) =>
            update((p) => ({ ...p, fiveWhys: { ...p.fiveWhys, whys } }))
          }
          idPrefix="rca-why"
          addLabel="Why"
          numbered
          minRows={1}
        />
        {rootCause ? (
          <div
            className={
              processLevel
                ? "rounded-lg border border-green-600/40 bg-green-600/5 p-3 dark:border-green-400/40"
                : "rounded-lg border bg-muted/30 p-3"
            }
          >
            <span className="text-xs text-muted-foreground">
              {processLevel
                ? "Root cause (process level)"
                : "Last answer — probably still a symptom"}
            </span>
            <p className="text-sm font-medium text-foreground">{rootCause}</p>
            {!processLevel ? (
              <p className="mt-1 text-xs text-muted-foreground">
                This still describes a thing that broke. Ask why once more until
                the answer names a standard, schedule, or system that allowed
                it.
              </p>
            ) : null}
          </div>
        ) : null}
        <SectionNote>
          Every answer should be verifiable with evidence. If a step is a guess,
          the chain below it is a guess too.
        </SectionNote>
      </CardContent>
    </Card>
  )
}

// --- Fishbone / Ishikawa --------------------------------------------------

/**
 * Ishikawa skeleton: a spine into the effect box, three ribs angled up and
 * three angled down, one per 6M category. Ribs whose category has causes are
 * drawn solid; empty ones stay dashed so the gaps are visible.
 */
function FishboneDiagram({
  effect,
  counts,
}: {
  effect: string
  counts: Record<FishboneCategory, number>
}) {
  const top = FISHBONE_CATEGORIES.slice(0, 3)
  const bottom = FISHBONE_CATEGORIES.slice(3)
  const spineY = 90
  const spineStart = 40
  const spineEnd = 560
  const ribXs = [140, 280, 420]

  return (
    <svg
      viewBox="0 0 760 190"
      className="h-auto w-full text-muted-foreground"
      role="img"
      aria-label={`Fishbone diagram for ${effect || "the effect"}`}
    >
      <line
        x1={spineStart}
        y1={spineY}
        x2={spineEnd}
        y2={spineY}
        stroke="currentColor"
        strokeWidth={2}
      />
      <path
        d={`M ${spineEnd} ${spineY - 10} L ${spineEnd + 20} ${spineY} L ${spineEnd} ${spineY + 10} Z`}
        fill="currentColor"
      />
      <rect
        x={spineEnd + 20}
        y={spineY - 20}
        width={170}
        height={40}
        rx={6}
        className="fill-destructive/10 stroke-destructive"
        strokeWidth={1.5}
      />
      <text
        x={spineEnd + 105}
        y={spineY + 4}
        textAnchor="middle"
        className="fill-destructive text-[11px] font-medium"
      >
        {(effect || "Effect").slice(0, 28)}
      </text>
      {top.map((cat, i) => (
        <g key={cat}>
          <line
            x1={ribXs[i]}
            y1={spineY - 60}
            x2={ribXs[i] + 60}
            y2={spineY}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray={counts[cat] > 0 ? undefined : "3 3"}
          />
          <text
            x={ribXs[i]}
            y={spineY - 66}
            textAnchor="middle"
            className="fill-foreground text-[11px] font-semibold"
          >
            {cat}
            {counts[cat] > 0 ? ` (${counts[cat]})` : ""}
          </text>
        </g>
      ))}
      {bottom.map((cat, i) => (
        <g key={cat}>
          <line
            x1={ribXs[i]}
            y1={spineY + 60}
            x2={ribXs[i] + 60}
            y2={spineY}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray={counts[cat] > 0 ? undefined : "3 3"}
          />
          <text
            x={ribXs[i]}
            y={spineY + 74}
            textAnchor="middle"
            className="fill-foreground text-[11px] font-semibold"
          >
            {cat}
            {counts[cat] > 0 ? ` (${counts[cat]})` : ""}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function FishboneCard({
  project,
  update,
  className = "lg:col-span-2",
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
  className?: string
}) {
  const { fishbone } = project
  const counts = Object.fromEntries(
    FISHBONE_CATEGORIES.map((cat) => [
      cat,
      fishbone.causes[cat].filter((c) => c.text.trim()).length,
    ])
  ) as Record<FishboneCategory, number>
  const causeCount = FISHBONE_CATEGORIES.reduce((a, c) => a + counts[c], 0)
  const emptyCategories = FISHBONE_CATEGORIES.filter((c) => counts[c] === 0)

  const setCauses = (cat: FishboneCategory, next: IdText[]) =>
    update((p) => ({
      ...p,
      fishbone: {
        ...p.fishbone,
        causes: { ...p.fishbone.causes, [cat]: next },
      },
    }))

  return (
    <Card className={`@container/card ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FishIcon className="size-4" />
          Cause &amp; Effect (Ishikawa) Diagram
        </CardTitle>
        <CardDescription>
          Spread possible causes across the six categories before committing to
          one. {causeCount} cause{causeCount === 1 ? "" : "s"} logged
          {emptyCategories.length > 0
            ? `; nothing yet under ${emptyCategories.join(", ")}`
            : " across all six categories"}
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fishbone-effect">Effect (the problem)</Label>
          <Input
            id="fishbone-effect"
            value={fishbone.effect}
            onChange={(e) =>
              update((p) => ({
                ...p,
                fishbone: { ...p.fishbone, effect: e.target.value },
              }))
            }
            className="max-w-sm"
          />
        </div>
        <FishboneDiagram effect={fishbone.effect} counts={counts} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FISHBONE_CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3"
            >
              <EditableTextList
                label={cat}
                items={fishbone.causes[cat]}
                onChange={(next) => setCauses(cat, next)}
                idPrefix={`fishbone-${cat}`}
                addLabel="Cause"
                placeholder={`${cat} cause`}
              />
            </div>
          ))}
        </div>
        <SectionNote>
          A branch with nothing on it is usually a blind spot rather than a
          clean bill of health. Causes listed here are candidates: the next step
          is to score them in the FMEA or test them against data, not to fix all
          of them.
        </SectionNote>
        <FlowFooter>
          <ToolLink href="/six-sigma/fmea">Score these in the FMEA</ToolLink>
          <ToolLink href="/qc-tools/scatter">Test a relationship</ToolLink>
          <ToolLink href="/qc-tools/pareto">Back to Pareto</ToolLink>
        </FlowFooter>
      </CardContent>
    </Card>
  )
}

function LinkCard({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  const { fiveWhys, fishbone } = project
  const rootCause =
    fiveWhys.whys.filter((w) => w.text.trim()).at(-1)?.text ?? ""
  const alreadyInMethod = fishbone.causes.Method.some(
    (c) => c.text.trim().toLowerCase() === rootCause.trim().toLowerCase()
  )
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3 lg:col-span-3">
      <Result
        label="Effect under investigation"
        value={fishbone.effect || "—"}
      />
      {rootCause && !alreadyInMethod ? (
        <SendButton
          onClick={() =>
            update((p) => ({
              ...p,
              fishbone: {
                ...p.fishbone,
                causes: {
                  ...p.fishbone.causes,
                  Method: [
                    ...p.fishbone.causes.Method,
                    { id: newId("fb"), text: rootCause },
                  ],
                },
              },
            }))
          }
        >
          Add the 5 Whys root cause to the fishbone
        </SendButton>
      ) : null}
    </div>
  )
}

export function RootCauseAnalysisCard() {
  const [project, update] = useSixSigmaProject()
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <FiveWhysCard project={project} update={update} />
      <FishboneCard project={project} update={update} />
      <LinkCard project={project} update={update} />
    </div>
  )
}

export function CauseEffectCard() {
  const [project, update] = useSixSigmaProject()
  return (
    <div className="grid gap-4">
      <FishboneCard project={project} update={update} className="" />
    </div>
  )
}

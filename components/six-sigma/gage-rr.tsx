"use client"

import * as React from "react"

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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Result,
  SectionNote,
  ToolLink,
  type Tone,
} from "@/components/calculator-primitives"
import { FlowFooter } from "@/components/six-sigma/shared"
import { newId } from "@/lib/six-sigma/project-store"
import { PlusIcon, XIcon, ScanSearchIcon } from "lucide-react"

type Verdict = "pass" | "fail"

type SampleRow = {
  id: string
  reference: Verdict
  // Two trials per appraiser, three appraisers.
  a1t1: Verdict
  a1t2: Verdict
  a2t1: Verdict
  a2t2: Verdict
  a3t1: Verdict
  a3t2: Verdict
}

const APPRAISERS = [
  { key: "a1", label: "Appraiser 1", trials: ["a1t1", "a1t2"] as const },
  { key: "a2", label: "Appraiser 2", trials: ["a2t1", "a2t2"] as const },
  { key: "a3", label: "Appraiser 3", trials: ["a3t1", "a3t2"] as const },
]

type TrialKey = (typeof APPRAISERS)[number]["trials"][number]

// 20 samples: the guide notes 10 is too few for a trustworthy attribute study.
// Appraiser 2 disagrees with itself on a few borderline parts and appraiser 3
// is biased toward passing, which is what a failing study looks like.
const SEED: Omit<SampleRow, "id">[] = [
  ["pass", "pass", "pass", "pass", "pass", "pass", "pass"],
  ["fail", "fail", "fail", "fail", "fail", "fail", "fail"],
  ["pass", "pass", "pass", "pass", "pass", "pass", "pass"],
  ["fail", "fail", "fail", "fail", "pass", "fail", "pass"],
  ["pass", "pass", "pass", "pass", "pass", "pass", "pass"],
  ["fail", "fail", "fail", "pass", "fail", "pass", "pass"],
  ["pass", "pass", "pass", "pass", "pass", "pass", "pass"],
  ["fail", "fail", "fail", "fail", "fail", "fail", "pass"],
  ["pass", "pass", "pass", "pass", "pass", "pass", "pass"],
  ["fail", "pass", "fail", "fail", "fail", "fail", "fail"],
  ["pass", "pass", "pass", "pass", "pass", "pass", "pass"],
  ["fail", "fail", "fail", "fail", "pass", "pass", "pass"],
  ["pass", "pass", "pass", "pass", "pass", "pass", "pass"],
  ["fail", "fail", "fail", "fail", "fail", "fail", "fail"],
  ["pass", "pass", "pass", "pass", "pass", "pass", "pass"],
  ["fail", "fail", "fail", "pass", "fail", "fail", "pass"],
  ["pass", "pass", "pass", "pass", "pass", "pass", "pass"],
  ["fail", "fail", "fail", "fail", "fail", "pass", "fail"],
  ["pass", "pass", "pass", "pass", "pass", "pass", "pass"],
  ["fail", "fail", "fail", "fail", "fail", "fail", "fail"],
].map(([reference, a1t1, a1t2, a2t1, a2t2, a3t1, a3t2]) => ({
  reference: reference as Verdict,
  a1t1: a1t1 as Verdict,
  a1t2: a1t2 as Verdict,
  a2t1: a2t1 as Verdict,
  a2t2: a2t2 as Verdict,
  a3t1: a3t1 as Verdict,
  a3t2: a3t2 as Verdict,
}))

function pctTone(pct: number): Tone {
  // Common attribute-study criteria: 90% and up acceptable, 80–90% marginal.
  return pct >= 90 ? "good" : pct >= 80 ? "warn" : "bad"
}

function VerdictSelect({
  value,
  onChange,
  label,
}: {
  value: Verdict
  onChange: (v: Verdict) => void
  label: string
}) {
  return (
    <NativeSelect
      size="sm"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as Verdict)}
    >
      <NativeSelectOption value="pass">Pass</NativeSelectOption>
      <NativeSelectOption value="fail">Fail</NativeSelectOption>
    </NativeSelect>
  )
}

export function GageRrTool() {
  const [rows, setRows] = React.useState<SampleRow[]>(() =>
    SEED.map((s, i) => ({ id: `gage-${i + 1}`, ...s }))
  )

  const patch = (id: string, changes: Partial<SampleRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)))

  const n = rows.length

  // Repeatability: does one appraiser agree with themselves across trials?
  const repeatability = APPRAISERS.map((a) => {
    const agree = rows.filter((r) => r[a.trials[0]] === r[a.trials[1]]).length
    return { ...a, agree, pct: n > 0 ? (agree / n) * 100 : 0 }
  })

  // Accuracy: does the appraiser match the known reference on both trials?
  const accuracy = APPRAISERS.map((a) => {
    const agree = rows.filter(
      (r) => r[a.trials[0]] === r.reference && r[a.trials[1]] === r.reference
    ).length
    return { ...a, agree, pct: n > 0 ? (agree / n) * 100 : 0 }
  })

  // Reproducibility: do all appraisers agree with each other on every trial?
  const reproducibleCount = rows.filter((r) => {
    const calls = APPRAISERS.flatMap((a) => a.trials.map((t) => r[t]))
    return calls.every((c) => c === calls[0])
  }).length
  const reproducibility = n > 0 ? (reproducibleCount / n) * 100 : 0

  // Effectiveness: all appraisers, all trials, agreeing with the reference.
  const effectiveCount = rows.filter((r) => {
    const calls = APPRAISERS.flatMap((a) => a.trials.map((t) => r[t]))
    return calls.every((c) => c === r.reference)
  }).length
  const effectiveness = n > 0 ? (effectiveCount / n) * 100 : 0

  // Misses matter more than false alarms: a missed defect reaches the customer.
  const missedDefects = rows.filter((r) => {
    if (r.reference !== "fail") return false
    return APPRAISERS.some((a) => a.trials.some((t) => r[t] === "pass"))
  }).length
  const falseAlarms = rows.filter((r) => {
    if (r.reference !== "pass") return false
    return APPRAISERS.some((a) => a.trials.some((t) => r[t] === "fail"))
  }).length

  const usable = effectiveness >= 90 && reproducibility >= 90
  const enoughSamples = n >= 20

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="@container/card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanSearchIcon className="size-4" />
              Measurement system verdict
            </CardTitle>
            <CardDescription>
              {usable
                ? "The appraisers agree with each other and with the reference often enough to trust the data this system produces."
                : "This measurement system is not trustworthy yet. Fix it before collecting data, or every conclusion downstream inherits its error."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Result
                label="Effectiveness"
                value={`${effectiveness.toFixed(0)}%`}
                tone={pctTone(effectiveness)}
                hint="all appraisers match the reference"
              />
              <Result
                label="Reproducibility"
                value={`${reproducibility.toFixed(0)}%`}
                tone={pctTone(reproducibility)}
                hint="appraisers agree with each other"
              />
              <Result
                label="Missed defects"
                value={String(missedDefects)}
                tone={missedDefects === 0 ? "good" : "bad"}
                hint="bad parts called good"
              />
              <Result
                label="False alarms"
                value={String(falseAlarms)}
                tone={falseAlarms === 0 ? "good" : "warn"}
                hint="good parts called bad"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow className="text-xs text-muted-foreground">
                  <TableHead>Appraiser</TableHead>
                  <TableHead>Repeatability (self-agreement)</TableHead>
                  <TableHead>Accuracy (vs. reference)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repeatability.map((r, i) => (
                  <TableRow key={r.key}>
                    <TableCell>{r.label}</TableCell>
                    <TableCell
                      className={
                        pctTone(r.pct) === "bad"
                          ? "text-destructive tabular-nums"
                          : "tabular-nums"
                      }
                    >
                      {r.pct.toFixed(0)}% ({r.agree} of {n})
                    </TableCell>
                    <TableCell
                      className={
                        pctTone(accuracy[i].pct) === "bad"
                          ? "text-destructive tabular-nums"
                          : "tabular-nums"
                      }
                    >
                      {accuracy[i].pct.toFixed(0)}% ({accuracy[i].agree} of {n})
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!enoughSamples ? (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                n = {n}. An attribute study needs at least 20 parts to be
                meaningful; with fewer, one disagreement swings the percentages
                too far.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="@container/card lg:col-span-1">
          <CardHeader>
            <CardTitle>How to run the study</CardTitle>
            <CardDescription>
              An attribute study for pass/fail judgments, which is what visual
              inspection produces.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs text-muted-foreground">
            <p>
              Pick at least 20 parts spanning clearly good, clearly bad, and
              borderline. Have a reference verdict for each one, decided by an
              expert or a measurement you trust.
            </p>
            <p>
              Use two or three appraisers. Each one judges every part twice, in
              a randomized order, without seeing their earlier answer or anyone
              else&apos;s.
            </p>
            <p>
              Low repeatability means the standard is unclear to that person.
              Low reproducibility means the appraisers are applying different
              standards. Low accuracy with high agreement means everyone learned
              the same wrong standard.
            </p>
            <SectionNote>
              For measured values rather than pass/fail, a variable study is
              needed, which requires an analysis of variance beyond what this
              tool covers.
            </SectionNote>
            <FlowFooter label="Then">
              <ToolLink href="/six-sigma/sample-size">Sample size</ToolLink>
              <ToolLink href="/six-sigma/capability">Capability</ToolLink>
            </FlowFooter>
          </CardContent>
        </Card>
      </div>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Appraisal data</CardTitle>
          <CardDescription>
            Each appraiser judges every part twice. Cells that disagree with the
            reference are marked.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table className="min-w-220">
            <TableHeader>
              <TableRow className="text-xs text-muted-foreground">
                <TableHead className="w-16">Part</TableHead>
                <TableHead className="w-28">Reference</TableHead>
                {APPRAISERS.flatMap((a) =>
                  a.trials.map((t, ti) => (
                    <TableHead key={t} className="w-28">
                      {a.label} · trial {ti + 1}
                    </TableHead>
                  ))
                )}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.id}>
                  <TableCell className="tabular-nums">{i + 1}</TableCell>
                  <TableCell>
                    <VerdictSelect
                      label={`Part ${i + 1} reference`}
                      value={row.reference}
                      onChange={(reference) => patch(row.id, { reference })}
                    />
                  </TableCell>
                  {APPRAISERS.flatMap((a) =>
                    a.trials.map((t, ti) => (
                      <TableCell
                        key={t}
                        className={
                          row[t] !== row.reference
                            ? "bg-destructive/5"
                            : undefined
                        }
                      >
                        <VerdictSelect
                          label={`Part ${i + 1} ${a.label} trial ${ti + 1}`}
                          value={row[t]}
                          onChange={(v) =>
                            patch(row.id, { [t]: v } as Partial<
                              Record<TrialKey, Verdict>
                            >)
                          }
                        />
                      </TableCell>
                    ))
                  )}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() =>
                        setRows((prev) => prev.filter((r) => r.id !== row.id))
                      }
                    >
                      <XIcon className="size-3" />
                      <span className="sr-only">Remove part</span>
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
              setRows((prev) => [
                ...prev,
                {
                  id: newId("gage"),
                  reference: "pass",
                  a1t1: "pass",
                  a1t2: "pass",
                  a2t1: "pass",
                  a2t2: "pass",
                  a3t1: "pass",
                  a3t2: "pass",
                },
              ])
            }
          >
            <PlusIcon className="size-3" />
            Part
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

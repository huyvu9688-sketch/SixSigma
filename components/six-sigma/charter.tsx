"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Result,
  SectionNote,
  TextField,
  ToolLink,
  fmt,
} from "@/components/calculator-primitives"
import { CellInput, FlowFooter } from "@/components/six-sigma/shared"
import { summarize } from "@/components/six-sigma/sigma-level"
import {
  newId,
  useSixSigmaProject,
  type Project,
} from "@/lib/six-sigma/project-store"
import { DMAIC_PHASES, DMAIC_PHASE_LABELS } from "@/lib/six-sigma/constants"
import {
  ClipboardListIcon,
  PlusIcon,
  UsersIcon,
  XIcon,
  CalendarIcon,
  TargetIcon,
} from "lucide-react"

// The checklist the guide gives for a problem statement: what, where, when,
// how much, and no solution baked in.
const PROBLEM_CHECKS: { label: string; test: (s: string) => boolean }[] = [
  {
    label: "Names the process or place",
    test: (s) =>
      /\b(line|station|cell|process|department|plant|shift)\b/i.test(s),
  },
  {
    label: "Says when it started or over what period",
    test: (s) =>
      /\b(since|between|from|during|month|week|quarter|year|20\d\d)\b/i.test(s),
  },
  {
    label: "Quantifies the gap with a number",
    test: (s) => /\d/.test(s),
  },
  {
    label: "States the business impact (cost, time, customer)",
    test: (s) =>
      /(\$|cost|hour|day|shift|customer|complaint|late|scrap|rework)/i.test(s),
  },
  {
    label: "Does not propose a solution",
    test: (s) =>
      !/\b(by (adding|installing|buying|replacing|training)|we should|solution is)\b/i.test(
        s
      ),
  },
]

function ProblemStatementCard({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  const { charter } = project
  const checks = PROBLEM_CHECKS.map((c) => ({
    ...c,
    passed: charter.problem.trim().length > 0 && c.test(charter.problem),
  }))
  const passedCount = checks.filter((c) => c.passed).length

  return (
    <Card className="@container/card lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardListIcon className="size-4" />
          Problem statement &amp; goal
        </CardTitle>
        <CardDescription>
          A strong problem statement says what is wrong, where, when, and how
          much it costs, without naming a solution. {passedCount} of{" "}
          {checks.length} checks pass.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <TextField
          id="charter-problem"
          label="Problem statement"
          multiline
          rows={4}
          value={charter.problem}
          onChange={(problem) =>
            update((p) => ({ ...p, charter: { ...p.charter, problem } }))
          }
          placeholder="Since April 2026, X% of units from Line 3 have been rejected for …, costing $… per month."
        />
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {checks.map((c) => (
            <li
              key={c.label}
              className={
                c.passed
                  ? "flex items-start gap-1.5 text-xs text-green-600 dark:text-green-400"
                  : "flex items-start gap-1.5 text-xs text-muted-foreground"
              }
            >
              <span aria-hidden>{c.passed ? "✓" : "○"}</span>
              {c.label}
            </li>
          ))}
        </ul>
        <TextField
          id="charter-goal"
          label="Objective / goal"
          multiline
          rows={2}
          value={charter.goal}
          onChange={(goal) =>
            update((p) => ({ ...p, charter: { ...p.charter, goal } }))
          }
          placeholder="Reduce … from X% to Y% by <date> without adding headcount."
        />
        <TextField
          id="charter-business-case"
          label="Business case (why it matters financially)"
          multiline
          rows={2}
          value={charter.businessCase}
          onChange={(businessCase) =>
            update((p) => ({ ...p, charter: { ...p.charter, businessCase } }))
          }
        />
        <SectionNote>
          The goal should be derivable from the problem statement alone. If you
          cannot write a measurable goal from it, the statement is too vague.
        </SectionNote>
      </CardContent>
    </Card>
  )
}

function ScopeCard({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  const { charter } = project
  const baseline = summarize(project.baseline)
  return (
    <Card className="@container/card lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TargetIcon className="size-4" />
          Scope &amp; baseline
        </CardTitle>
        <CardDescription>
          A hard start and end keeps the project from sprawling.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <TextField
          id="charter-scope-in"
          label="In scope"
          multiline
          rows={3}
          value={charter.scopeIn}
          onChange={(scopeIn) =>
            update((p) => ({ ...p, charter: { ...p.charter, scopeIn } }))
          }
        />
        <TextField
          id="charter-scope-out"
          label="Out of scope"
          multiline
          rows={3}
          value={charter.scopeOut}
          onChange={(scopeOut) =>
            update((p) => ({ ...p, charter: { ...p.charter, scopeOut } }))
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <Result
            label="Baseline sigma"
            value={
              baseline.hasData ? `${baseline.sigmaLevel.toFixed(2)}σ` : "—"
            }
            tone={baseline.hasData ? baseline.tone : "default"}
          />
          <Result
            label="Baseline cost"
            value={baseline.hasData ? fmt.money(baseline.cost) : "—"}
          />
        </div>
        <ToolLink href="/calculators/six-sigma">Edit baseline data</ToolLink>
      </CardContent>
    </Card>
  )
}

function TeamCard({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  const { charter } = project
  const setTeam = (team: Project["charter"]["team"]) =>
    update((p) => ({ ...p, charter: { ...p.charter, team } }))

  return (
    <Card className="@container/card lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="size-4" />
          Team, sponsor &amp; customers
        </CardTitle>
        <CardDescription>
          Every charter names who owns the outcome and who receives the output.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            id="charter-sponsor"
            label="Sponsor / champion"
            value={charter.sponsor}
            onChange={(sponsor) =>
              update((p) => ({ ...p, charter: { ...p.charter, sponsor } }))
            }
          />
          <TextField
            id="charter-internal"
            label="Internal customers"
            value={charter.customersInternal}
            onChange={(customersInternal) =>
              update((p) => ({
                ...p,
                charter: { ...p.charter, customersInternal },
              }))
            }
          />
          <TextField
            id="charter-external"
            label="External customers"
            value={charter.customersExternal}
            onChange={(customersExternal) =>
              update((p) => ({
                ...p,
                charter: { ...p.charter, customersExternal },
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Team members and roles</Label>
          {charter.team.map((member, i) => (
            <div
              key={member.id}
              className="grid grid-cols-[1fr_1fr_auto] items-center gap-1.5"
            >
              <CellInput
                label={`Team member ${i + 1} name`}
                value={member.name}
                placeholder="Name"
                onChange={(name) =>
                  setTeam(
                    charter.team.map((m) =>
                      m.id === member.id ? { ...m, name } : m
                    )
                  )
                }
              />
              <CellInput
                label={`Team member ${i + 1} role`}
                value={member.role}
                placeholder="Role"
                onChange={(role) =>
                  setTeam(
                    charter.team.map((m) =>
                      m.id === member.id ? { ...m, role } : m
                    )
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() =>
                  setTeam(charter.team.filter((m) => m.id !== member.id))
                }
              >
                <XIcon className="size-3" />
                <span className="sr-only">Remove team member</span>
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-fit gap-1 text-xs"
            onClick={() =>
              setTeam([
                ...charter.team,
                { id: newId("tm"), name: "", role: "" },
              ])
            }
          >
            <PlusIcon className="size-3" />
            Member
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ScheduleCard({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  const { charter } = project
  return (
    <Card className="@container/card lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="size-4" />
          Phase schedule
        </CardTitle>
        <CardDescription>
          Target tollgate date for each DMAIC phase.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Table>
          <TableHeader>
            <TableRow className="text-xs text-muted-foreground">
              <TableHead>Phase</TableHead>
              <TableHead>Tollgate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DMAIC_PHASES.map((phase) => (
              <TableRow key={phase}>
                <TableCell>{DMAIC_PHASE_LABELS[phase]}</TableCell>
                <TableCell>
                  <Input
                    type="date"
                    aria-label={`${DMAIC_PHASE_LABELS[phase]} tollgate date`}
                    value={charter.schedule[phase]}
                    onChange={(e) =>
                      update((p) => ({
                        ...p,
                        charter: {
                          ...p.charter,
                          schedule: {
                            ...p.charter.schedule,
                            [phase]: e.target.value,
                          },
                        },
                      }))
                    }
                    className="h-8 text-sm"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <FlowFooter>
          <ToolLink href="/six-sigma/sipoc">SIPOC</ToolLink>
          <ToolLink href="/six-sigma/ctq">CTQ tree</ToolLink>
        </FlowFooter>
      </CardContent>
    </Card>
  )
}

export function CharterTool() {
  const [project, update] = useSixSigmaProject()
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ProblemStatementCard project={project} update={update} />
      <ScopeCard project={project} update={update} />
      <TeamCard project={project} update={update} />
      <ScheduleCard project={project} update={update} />
    </div>
  )
}

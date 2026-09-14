"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SectionNote,
  TextField,
  ToolLink,
} from "@/components/calculator-primitives"
import { EditableTextList, FlowFooter } from "@/components/six-sigma/shared"
import {
  useSixSigmaProject,
  type IdText,
  type Project,
  type Sipoc,
} from "@/lib/six-sigma/project-store"
import { WorkflowIcon } from "lucide-react"

const LANES: {
  key: keyof Sipoc
  title: string
  letter: string
  hint: string
  addLabel: string
}[] = [
  {
    key: "suppliers",
    title: "Suppliers",
    letter: "S",
    hint: "Who provides the inputs",
    addLabel: "Supplier",
  },
  {
    key: "inputs",
    title: "Inputs",
    letter: "I",
    hint: "What goes into the process",
    addLabel: "Input",
  },
  {
    key: "process",
    title: "Process",
    letter: "P",
    hint: "4–7 high-level steps, in order",
    addLabel: "Step",
  },
  {
    key: "outputs",
    title: "Outputs",
    letter: "O",
    hint: "What the process produces",
    addLabel: "Output",
  },
  {
    key: "customers",
    title: "Customers",
    letter: "C",
    hint: "Who receives the outputs",
    addLabel: "Customer",
  },
]

function ProcessFlow({ steps }: { steps: IdText[] }) {
  const named = steps.filter((s) => s.text.trim())
  if (named.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {named.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1.5">
          <span className="rounded-lg border bg-muted/40 px-2.5 py-1 text-xs font-medium">
            {step.text}
          </span>
          {i < named.length - 1 ? (
            <span aria-hidden className="text-muted-foreground">
              →
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function SipocTool() {
  const [project, update] = useSixSigmaProject()
  const setLane = (key: keyof Sipoc, next: IdText[]) =>
    update((p: Project) => ({ ...p, sipoc: { ...p.sipoc, [key]: next } }))

  return (
    <div className="flex flex-col gap-4">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WorkflowIcon className="size-4" />
            SIPOC Diagram
          </CardTitle>
          <CardDescription>
            Suppliers, Inputs, Process, Outputs, Customers. Keep the process
            lane high level: 4 to 7 steps, no decision branches. Set the
            boundaries first so everyone agrees where the process starts and
            ends.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TextField
            id="sipoc-name"
            label="Process name and boundaries"
            value={project.name}
            onChange={(name) => update((p) => ({ ...p, name }))}
          />
          <ProcessFlow steps={project.sipoc.process} />
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            {LANES.map((lane) => (
              <div
                key={lane.key}
                className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-muted-foreground">
                    {lane.letter}
                  </span>
                  <span className="text-sm font-medium">{lane.title}</span>
                </div>
                <SectionNote>{lane.hint}</SectionNote>
                <EditableTextList
                  items={project.sipoc[lane.key]}
                  onChange={(next) => setLane(lane.key, next)}
                  idPrefix={`sipoc-${lane.key}`}
                  addLabel={lane.addLabel}
                  placeholder={lane.title.replace(/s$/, "")}
                />
              </div>
            ))}
          </div>
          <FlowFooter>
            <ToolLink href="/six-sigma/ctq">Turn outputs into CTQs</ToolLink>
            <ToolLink href="/six-sigma/fmea">
              Score each step in the FMEA
            </ToolLink>
            <ToolLink href="/six-sigma/control-plan">Control plan</ToolLink>
          </FlowFooter>
        </CardContent>
      </Card>
    </div>
  )
}

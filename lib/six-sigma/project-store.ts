"use client"

// One Six Sigma project per browser, persisted to localStorage and exposed
// through useSyncExternalStore so every DMAIC tool reads and writes the same
// data. The server snapshot is the seeded example project, so server render
// and first client render match; the persisted copy takes over right after
// hydration without any setState-in-effect.

import * as React from "react"
import {
  DMAIC_PHASES,
  FISHBONE_CATEGORIES,
  type DmaicPhase,
  type FishboneCategory,
} from "./constants"

export type IdText = { id: string; text: string }

export type Ctq = {
  id: string
  need: string
  driver: string
  requirement: string
  unit: string
  lsl: string
  usl: string
}

export type TeamMember = { id: string; name: string; role: string }

export type Charter = {
  problem: string
  goal: string
  businessCase: string
  scopeIn: string
  scopeOut: string
  sponsor: string
  team: TeamMember[]
  customersInternal: string
  customersExternal: string
  ctqs: Ctq[]
  schedule: Record<DmaicPhase, string>
}

export type Sipoc = {
  suppliers: IdText[]
  inputs: IdText[]
  process: IdText[]
  outputs: IdText[]
  customers: IdText[]
}

export type DefectRateInput = {
  units: string
  opportunities: string
  defects: string
  costPerDefect: string
}

export type CostOfQuality = {
  externalFailure: string
  internalFailure: string
  prevention: string
  appraisal: string
  sales: string
}

export type Spec = { usl: string; lsl: string; target: string; unit: string }

export type DefectCategory = { id: string; name: string; count: string }

export type FmeaRow = {
  id: string
  step: string
  failure: string
  effect: string
  sev: string
  cause: string
  occ: string
  control: string
  det: string
  action: string
  owner: string
  completed: boolean
  sevAfter: string
  occAfter: string
  detAfter: string
}

export type ControlPlanRow = {
  id: string
  step: string
  metric: string
  lsl: string
  usl: string
  unit: string
  method: string
  sampleSize: string
  frequency: string
  owner: string
  record: string
  reaction: string
}

export type Project = {
  version: number
  name: string
  phase: DmaicPhase
  charter: Charter
  sipoc: Sipoc
  baseline: DefectRateInput
  improved: DefectRateInput
  copq: CostOfQuality
  measurementsRaw: string
  spec: Spec
  defectCategories: DefectCategory[]
  fishbone: { effect: string; causes: Record<FishboneCategory, IdText[]> }
  fiveWhys: { problem: string; whys: IdText[] }
  fmea: FmeaRow[]
  controlPlan: ControlPlanRow[]
  tollgates: Record<DmaicPhase, boolean[]>
}

export const PROJECT_VERSION = 1
const STORAGE_KEY = "wanek-six-sigma-project"

// Deterministic ids for seed data (must match between server and client).
let seedCounter = 0
const sid = (prefix: string) => `${prefix}-${++seedCounter}`
const list = (prefix: string, texts: string[]): IdText[] =>
  texts.map((text) => ({ id: sid(prefix), text }))

export function createSeedProject(): Project {
  seedCounter = 0
  return {
    version: PROJECT_VERSION,
    name: "Reduce finish scratches on Line 3 sofa frames",
    phase: "define",
    charter: {
      problem:
        "Since April 2026, 4.1% of sofa frames leaving Line 3 finishing have been rejected or reworked for surface scratches (1,480 defects across 12,000 frames), costing roughly $18,400 per month in rework and scrap and delaying upholstery by up to two shifts.",
      goal: "Cut scratch-related defects on Line 3 from 4.1% to below 1% of frames (≥ 4σ) by 31 December 2026 without adding inspection headcount.",
      businessCase:
        "Scratches are the top defect category on the line (41% of all defects). Each defect costs about $35 in rework labor, stain, and lacquer, plus late shipments to the upholstery line.",
      scopeIn:
        "Line 3 finishing: sanding, staining, drying, lacquer, inspection, and transfer to the upholstery buffer.",
      scopeOut:
        "Frame assembly upstream of finishing, upholstery, and packaging.",
      sponsor: "Plant manager",
      team: [
        { id: sid("tm"), name: "J. Vu", role: "Black Belt / project lead" },
        { id: sid("tm"), name: "Line 3 supervisor", role: "Process owner" },
        { id: sid("tm"), name: "Finishing operator", role: "SME" },
        { id: sid("tm"), name: "Maintenance tech", role: "SME" },
        { id: sid("tm"), name: "Quality inspector", role: "Data collection" },
      ],
      customersInternal: "Upholstery line, shipping",
      customersExternal: "Retail furniture customers",
      ctqs: [
        {
          id: sid("ctq"),
          need: "Frames look flawless",
          driver: "No visible scratches on show faces",
          requirement: "Scratches per frame on show faces",
          unit: "count",
          lsl: "",
          usl: "0",
        },
        {
          id: sid("ctq"),
          need: "Durable finish",
          driver: "Even lacquer coat",
          requirement: "Coating thickness",
          unit: "µm",
          lsl: "60",
          usl: "90",
        },
        {
          id: sid("ctq"),
          need: "Frames arrive on time",
          driver: "No rework loop before upholstery",
          requirement: "Frames delivered within takt",
          unit: "%",
          lsl: "98",
          usl: "",
        },
      ],
      schedule: {
        define: "2026-09-01",
        measure: "2026-09-22",
        analyze: "2026-10-13",
        improve: "2026-11-03",
        control: "2026-12-01",
      },
    },
    sipoc: {
      suppliers: list("sup", [
        "Frame assembly",
        "Stain & lacquer vendor",
        "Maintenance",
      ]),
      inputs: list("inp", [
        "Assembled frames",
        "Stain, lacquer, sanding pads",
        "Transfer carts",
      ]),
      process: list("proc", [
        "Sand",
        "Stain",
        "Dry",
        "Lacquer",
        "Inspect",
        "Transfer to buffer",
      ]),
      outputs: list("out", ["Finished frames", "Inspection records"]),
      customers: list("cust", ["Upholstery line", "Retail customer"]),
    },
    baseline: {
      units: "12000",
      opportunities: "3",
      defects: "1480",
      costPerDefect: "35",
    },
    improved: {
      units: "",
      opportunities: "3",
      defects: "",
      costPerDefect: "35",
    },
    copq: {
      externalFailure: "6200",
      internalFailure: "12200",
      prevention: "3000",
      appraisal: "4500",
      sales: "620000",
    },
    measurementsRaw:
      "74.2, 76.8, 71.5, 78.1, 75.0, 73.4, 79.6, 72.8, 77.3, 75.9, 70.9, 76.2, 74.7, 81.4, 73.9, 75.5, 77.8, 72.1, 76.4, 74.0, 78.9, 73.2, 75.8, 71.7, 76.9",
    spec: { usl: "90", lsl: "60", target: "75", unit: "µm" },
    defectCategories: [
      { id: sid("dc"), name: "Scratches", count: "420" },
      { id: sid("dc"), name: "Stain blotching", count: "260" },
      { id: sid("dc"), name: "Drips / runs", count: "150" },
      { id: sid("dc"), name: "Dust nibs", count: "90" },
      { id: sid("dc"), name: "Discoloration", count: "60" },
      { id: sid("dc"), name: "Contamination", count: "35" },
      { id: sid("dc"), name: "Dents", count: "20" },
    ],
    fishbone: {
      effect: "Surface scratches after finishing",
      causes: {
        Man: list("fb", ["Operators stack frames face-down on carts"]),
        Machine: list("fb", ["Transfer cart rail pads worn through"]),
        Method: list("fb", ["No standard for frame orientation on carts"]),
        Material: list("fb", ["Coarse sanding pad used for final pass"]),
        Measurement: list("fb", ["Scratch severity judged by eye, no gauge"]),
        Environment: list("fb", [
          "Dust from sanding drifts into lacquer booth",
        ]),
      },
    },
    fiveWhys: {
      problem: "Frames leaving Line 3 finishing have surface scratches",
      whys: list("why", [
        "Frames are scratched while being moved to the drying rack",
        "Frames slide on bare steel cart rails during transfer",
        "The rubber pads on the cart rails are worn through",
        "Pad replacement is not on the preventive maintenance schedule",
        "The cart was never added to the CMMS asset list",
      ]),
    },
    fmea: [
      {
        id: sid("fmea"),
        step: "Transfer to drying rack",
        failure: "Frame slides on bare rail",
        effect: "Scratch on show face, rework",
        sev: "6",
        cause: "Worn cart rail pads",
        occ: "8",
        control: "Visual check at pack-out",
        det: "6",
        action: "Replace pads, add cart to PM schedule",
        owner: "Maintenance — 2026-10-01",
        completed: false,
        sevAfter: "6",
        occAfter: "2",
        detAfter: "4",
      },
      {
        id: sid("fmea"),
        step: "Final sanding",
        failure: "Wrong grit pad used",
        effect: "Visible sanding marks under stain",
        sev: "5",
        cause: "Pads not labeled by grit",
        occ: "5",
        control: "Operator judgment",
        det: "7",
        action: "Color-code pad bins, post grit sequence at station",
        owner: "Line 3 supervisor — 2026-10-08",
        completed: false,
        sevAfter: "5",
        occAfter: "2",
        detAfter: "5",
      },
      {
        id: sid("fmea"),
        step: "Lacquer",
        failure: "Dust lands in wet lacquer",
        effect: "Dust nibs, polishing rework",
        sev: "4",
        cause: "Sanding dust drifts into booth",
        occ: "6",
        control: "None",
        det: "8",
        action: "Seal booth door, add sanding extraction",
        owner: "Maintenance — 2026-10-15",
        completed: false,
        sevAfter: "4",
        occAfter: "3",
        detAfter: "8",
      },
    ],
    controlPlan: [
      {
        id: sid("cp"),
        step: "Transfer to drying rack",
        metric: "Scratches per frame on show faces",
        lsl: "",
        usl: "0",
        unit: "count",
        method: "Visual check under inspection lamp",
        sampleSize: "5 frames",
        frequency: "Every 2 hours",
        owner: "Finishing operator",
        record: "Line 3 check sheet",
        reaction:
          "Stop transfers, inspect cart pads, replace if worn, re-inspect the last 20 frames, notify supervisor.",
      },
      {
        id: sid("cp"),
        step: "Lacquer",
        metric: "Coating thickness",
        lsl: "60",
        usl: "90",
        unit: "µm",
        method: "Dry film thickness gauge, 3 readings per frame",
        sampleSize: "3 frames",
        frequency: "Start of shift and every 4 hours",
        owner: "Quality inspector",
        record: "Coating thickness log",
        reaction:
          "Adjust gun pressure per SOP 3.14, re-measure next 3 frames, quarantine frames since last good reading.",
      },
    ],
    tollgates: {
      define: [true, true, true, false],
      measure: [false, false, false],
      analyze: [false, false, false],
      improve: [false, false, false],
      control: [false, false, false],
    },
  }
}

export const TOLLGATE_ITEMS: Record<DmaicPhase, string[]> = {
  define: [
    "Problem statement answers what, where, when, how much",
    "Charter signed off by sponsor",
    "SIPOC drawn with process owner and SMEs",
    "CTQs defined with measurable limits",
  ],
  measure: [
    "Baseline sigma level / DPMO calculated",
    "Measurement system checked (Gage R&R)",
    "Data collected with an adequate sample size",
  ],
  analyze: [
    "Vital few defect categories identified (Pareto)",
    "Root cause verified, not just brainstormed",
    "Cause–effect relationship tested with data",
  ],
  improve: [
    "Solutions piloted and measured before/after",
    "FMEA rescored with actions completed",
    "Implementation plan scheduled and staffed",
  ],
  control: [
    "Process in statistical control on the control chart",
    "Capability meets the CTQ (Cpk ≥ 1.33)",
    "Control plan handed to the process owner",
  ],
}

// --- Store ---------------------------------------------------------------

const SEED = createSeedProject()
let state: Project | null = null
const listeners = new Set<() => void>()

function mergeWithSeed(parsed: unknown): Project {
  if (!parsed || typeof parsed !== "object") return SEED
  const p = parsed as Partial<Project>
  if (p.version !== PROJECT_VERSION) return SEED
  // Shallow-merge each top-level slice so a project saved before a field was
  // added still loads; nested seeds only fill in missing top-level keys.
  const merged: Project = { ...SEED, ...p } as Project
  merged.charter = { ...SEED.charter, ...(p.charter ?? {}) }
  merged.sipoc = { ...SEED.sipoc, ...(p.sipoc ?? {}) }
  merged.fishbone = {
    effect: p.fishbone?.effect ?? SEED.fishbone.effect,
    causes: Object.fromEntries(
      FISHBONE_CATEGORIES.map((cat) => [
        cat,
        p.fishbone?.causes?.[cat] ?? SEED.fishbone.causes[cat],
      ])
    ) as Record<FishboneCategory, IdText[]>,
  }
  merged.tollgates = Object.fromEntries(
    DMAIC_PHASES.map((phase) => [
      phase,
      TOLLGATE_ITEMS[phase].map((_, i) => p.tollgates?.[phase]?.[i] ?? false),
    ])
  ) as Record<DmaicPhase, boolean[]>
  return merged
}

function load(): Project {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? mergeWithSeed(JSON.parse(raw)) : SEED
  } catch {
    return SEED
  }
}

function getSnapshot(): Project {
  if (state === null) state = load()
  return state
}

function getServerSnapshot(): Project {
  return SEED
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  for (const l of listeners) l()
}

export type ProjectUpdater = (prev: Project) => Project

export function updateProject(updater: ProjectUpdater) {
  state = updater(getSnapshot())
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage may be unavailable (private mode, quota); keep in-memory state.
  }
  emit()
}

export function resetProject() {
  updateProject(() => createSeedProject())
}

/** Read the shared project and get an updater. Client components only. */
export function useSixSigmaProject() {
  const project = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  return [project, updateProject] as const
}

// Runtime id generator for user-created rows (never used during render).
let runtimeCounter = 0
export function newId(prefix: string) {
  runtimeCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${runtimeCounter}`
}

// --- Derived metrics shared by the hub and several tools ------------------

export function defectRateNumbers(input: DefectRateInput) {
  const units = Number(input.units)
  const opportunities = Number(input.opportunities)
  const defects = Number(input.defects)
  const cost = Number(input.costPerDefect)
  const ok = [units, opportunities, defects].every(
    (n) => Number.isFinite(n) && n >= 0
  )
  return {
    units: ok ? units : 0,
    opportunities: ok ? opportunities : 0,
    defects: ok ? defects : 0,
    costPerDefect: Number.isFinite(cost) && cost >= 0 ? cost : 0,
    hasData: ok && units > 0 && opportunities > 0,
  }
}

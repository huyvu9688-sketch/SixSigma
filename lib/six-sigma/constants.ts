// Reference tables used by the Six Sigma tools. Sources are the worked
// examples and tables in ref/Six-Sigma-A-Complete-Step-by-Step-Guide.md.

// X̄-R chart constants by subgroup size n (Shewhart tables).
// A2 scales R̄ into X̄ limits, D3/D4 bound the R chart, d2 converts R̄ to σ.
export const XBAR_R_CONSTANTS: Record<
  number,
  { A2: number; D3: number; D4: number; d2: number }
> = {
  2: { A2: 1.88, D3: 0, D4: 3.267, d2: 1.128 },
  3: { A2: 1.023, D3: 0, D4: 2.574, d2: 1.693 },
  4: { A2: 0.729, D3: 0, D4: 2.282, d2: 2.059 },
  5: { A2: 0.577, D3: 0, D4: 2.114, d2: 2.326 },
  6: { A2: 0.483, D3: 0, D4: 2.004, d2: 2.534 },
  7: { A2: 0.419, D3: 0.076, D4: 1.924, d2: 2.704 },
  8: { A2: 0.373, D3: 0.136, D4: 1.864, d2: 2.847 },
  9: { A2: 0.337, D3: 0.184, D4: 1.816, d2: 2.97 },
  10: { A2: 0.308, D3: 0.223, D4: 1.777, d2: 3.078 },
}

// Sigma levels shown in the reference table (guide, "What is Six Sigma?").
export const REFERENCE_SIGMA_LEVELS = [1, 2, 3, 3.5, 4, 4.5, 5, 6]

// Cost of quality as a percent of sales, by sigma level (guide, "Quality").
export const COQ_PERCENT_OF_SALES_BY_SIGMA: {
  sigma: number
  range: string
  low: number
  high: number
}[] = [
  { sigma: 2, range: "Above 40%", low: 40, high: 100 },
  { sigma: 3, range: "25 to 40%", low: 25, high: 40 },
  { sigma: 4, range: "15 to 25%", low: 15, high: 25 },
  { sigma: 5, range: "5 to 15%", low: 5, high: 15 },
  { sigma: 6, range: "Less than 1%", low: 0, high: 1 },
]

// Common confidence levels and the matching two-sided z value.
export const CONFIDENCE_LEVELS = [
  { label: "90%", alpha: 0.1 },
  { label: "95%", alpha: 0.05 },
  { label: "99%", alpha: 0.01 },
  { label: "99.9%", alpha: 0.001 },
]

export const POWER_LEVELS = [
  { label: "80%", power: 0.8 },
  { label: "90%", power: 0.9 },
  { label: "95%", power: 0.95 },
]

// The 6M categories for a manufacturing fishbone diagram.
export const FISHBONE_CATEGORIES = [
  "Man",
  "Machine",
  "Method",
  "Material",
  "Measurement",
  "Environment",
] as const

export type FishboneCategory = (typeof FISHBONE_CATEGORIES)[number]

export const DMAIC_PHASES = [
  "define",
  "measure",
  "analyze",
  "improve",
  "control",
] as const

export type DmaicPhase = (typeof DMAIC_PHASES)[number]

export const DMAIC_PHASE_LABELS: Record<DmaicPhase, string> = {
  define: "Define",
  measure: "Measure",
  analyze: "Analyze",
  improve: "Improve",
  control: "Control",
}

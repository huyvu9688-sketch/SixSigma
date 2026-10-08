// Pure statistics used across the Six Sigma tools. No React in this file.
// Formulas follow ref/Six-Sigma-A-Complete-Step-by-Step-Guide.md; see the
// design spec (docs/superpowers/specs) for the line references.

import { XBAR_R_CONSTANTS } from "./constants"

// --- Parsing -------------------------------------------------------------

/** Parse a free-text list of numbers separated by commas, spaces, or newlines. */
export function parseNumberList(raw: string): number[] {
  return raw
    .split(/[\s,;]+/)
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n))
}

/** Parse subgroups: one subgroup per line, values separated by commas/spaces. */
export function parseSubgroups(raw: string): number[][] {
  return raw
    .split(/\r?\n/)
    .map((line) => parseNumberList(line))
    .filter((g) => g.length > 0)
}

/** Parse a raw text input to a finite, non-negative number (0 when invalid). */
export function toNonNegative(raw: string | number | undefined): number {
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(n, 0) : 0
}

/** Parse a raw text input to any finite number (0 when invalid). */
export function toNumber(raw: string | number | undefined): number {
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

// --- Descriptive ---------------------------------------------------------

export function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0)
}

export function mean(xs: number[]): number {
  return xs.length > 0 ? sum(xs) / xs.length : 0
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

/** Sample (n − 1) standard deviation by default; population when sample=false. */
export function stdDev(xs: number[], sample = true): number {
  const n = xs.length
  if (n === 0 || (sample && n < 2)) return 0
  const m = mean(xs)
  const ss = xs.reduce((acc, v) => acc + (v - m) ** 2, 0)
  return Math.sqrt(ss / (sample ? n - 1 : n))
}

/** Sturges' rule for histogram bin count. */
export function sturgesBins(n: number): number {
  return n > 0 ? Math.max(Math.ceil(Math.log2(n) + 1), 1) : 1
}

export type HistogramBin = {
  lo: number
  hi: number
  midpoint: number
  count: number
}

export function histogram(values: number[], bins: number): HistogramBin[] {
  const n = values.length
  if (n === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const b = Math.max(Math.round(bins), 1)
  const width = range > 0 ? range / b : 1
  return Array.from({ length: b }, (_, i) => {
    const lo = min + i * width
    const hi =
      i === b - 1 ? (range > 0 ? max : min + width) : min + (i + 1) * width
    const count = values.filter(
      (v) => v >= lo && (i === b - 1 ? v <= hi : v < hi)
    ).length
    return { lo, hi, midpoint: (lo + hi) / 2, count }
  })
}

// --- Normal distribution -------------------------------------------------

/** Error function via the Abramowitz–Stegun 7.1.26 approximation (|ε| < 1.5e-7). */
export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * ax)
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-ax * ax)
  return sign * y
}

export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

export function normalPdf(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI)
}

/** Inverse normal CDF (Acklam's algorithm, relative error ~1.15e-9). */
export function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ]
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ]
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ]
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ]
  const pLow = 0.02425
  const pHigh = 1 - pLow
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  }
  if (p <= pHigh) {
    const q = p - 0.5
    const r = q * q
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    )
  }
  const q = Math.sqrt(-2 * Math.log(1 - p))
  return (
    -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  )
}

// --- Sigma level / DPMO --------------------------------------------------

/** Long-term DPMO for a sigma level, using the conventional 1.5σ shift. */
export function dpmoFromSigma(sigma: number, shift = 1.5): number {
  return 1_000_000 * (1 - normalCdf(sigma - shift))
}

/** Sigma level from DPMO (inverse of dpmoFromSigma, 1.5σ shift). */
export function sigmaFromDpmo(dpmo: number, shift = 1.5): number {
  if (dpmo <= 0) return 6
  if (dpmo >= 1_000_000) return 0
  return normalQuantile(1 - dpmo / 1_000_000) + shift
}

export function dpmo(
  defects: number,
  units: number,
  opportunitiesPerUnit: number
) {
  const totalOpportunities = units * opportunitiesPerUnit
  return totalOpportunities > 0 ? (defects / totalOpportunities) * 1e6 : 0
}

// --- Yield ---------------------------------------------------------------

/** First time yield = good units ÷ units entering the step. */
export function fty(good: number, entering: number): number {
  return entering > 0 ? Math.min(Math.max(good / entering, 0), 1) : 0
}

export type YieldStep = { entering: number; scrap: number; rework: number }

/**
 * Rolled throughput yield. Per step: (entering − (scrap + rework)) ÷ entering.
 * FTY per step ignores rework: (entering − scrap) ÷ entering.
 */
export function rolledThroughputYield(steps: YieldStep[]) {
  const perStep = steps.map((s) => {
    const good = Math.max(s.entering - s.scrap, 0)
    const stepFty = fty(good, s.entering)
    const stepRty =
      s.entering > 0
        ? Math.min(
            Math.max((s.entering - (s.scrap + s.rework)) / s.entering, 0),
            1
          )
        : 0
    return { ...s, good, fty: stepFty, rty: stepRty }
  })
  const overallFty = perStep.reduce(
    (acc, s) => acc * s.fty,
    steps.length ? 1 : 0
  )
  const overallRty = perStep.reduce(
    (acc, s) => acc * s.rty,
    steps.length ? 1 : 0
  )
  return { perStep, overallFty, overallRty }
}

// --- Capability ----------------------------------------------------------

export type CapabilityInput = {
  usl: number
  lsl: number
  mean: number
  stdDev: number
}

export function capability({ usl, lsl, mean: m, stdDev: sd }: CapabilityInput) {
  const hasSpread = sd > 0 && usl > lsl
  const cp = hasSpread ? (usl - lsl) / (6 * sd) : 0
  const zUpper = hasSpread ? (usl - m) / sd : 0
  const zLower = hasSpread ? (m - lsl) / sd : 0
  const cpu = zUpper / 3
  const cpl = zLower / 3
  const cpk = hasSpread ? Math.min(cpu, cpl) : 0
  // Sigma level per the guide: distance to the nearest spec limit in σ.
  const sigmaLevel = hasSpread ? Math.min(zUpper, zLower) : 0
  // Expected fraction outside spec (both tails, short-term, no shift).
  const ppmOutside = hasSpread
    ? 1e6 * (normalCdf(-zUpper) + normalCdf(-zLower))
    : 0
  return {
    hasSpread,
    cp,
    cpu,
    cpl,
    cpk,
    zUpper,
    zLower,
    sigmaLevel,
    ppmOutside,
  }
}

export type SubgroupCapabilityPoint = {
  index: number
  n: number
  min: number
  max: number
  median: number
  mean: number
  cpk: number
}

/**
 * Splits values (assumed to be in time order) into fixed-size subgroups,
 * most recent first, and reports Cpk per subgroup so a run of them shows
 * whether capability is stable or drifting (cf. a Cpk-by-subgroup boxplot).
 * A short leftover subgroup at the oldest end is dropped, never the newest.
 */
export function subgroupCapability(
  values: number[],
  size: number,
  usl: number,
  lsl: number,
  maxSubgroups = 12
): SubgroupCapabilityPoint[] {
  if (size < 2 || values.length < size) return []
  const groups: number[][] = []
  for (
    let end = values.length;
    end - size >= 0 && groups.length < maxSubgroups;
    end -= size
  ) {
    groups.unshift(values.slice(end - size, end))
  }
  return groups.map((g, index) => {
    const m = mean(g)
    const sd = stdDev(g)
    const cap = capability({ usl, lsl, mean: m, stdDev: sd })
    return {
      index,
      n: g.length,
      min: Math.min(...g),
      max: Math.max(...g),
      median: median(g),
      mean: m,
      cpk: cap.cpk,
    }
  })
}

// --- Regression / correlation -------------------------------------------

export function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length
  const mx = mean(points.map((p) => p.x))
  const my = mean(points.map((p) => p.y))
  const sxy = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0)
  const sxx = points.reduce((s, p) => s + (p.x - mx) ** 2, 0)
  const syy = points.reduce((s, p) => s + (p.y - my) ** 2, 0)
  const r = n > 1 && sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0
  const slope = n > 1 && sxx > 0 ? sxy / sxx : 0
  const intercept = my - slope * mx
  return { n, r, r2: r * r, slope, intercept, meanX: mx, meanY: my }
}

// --- Control charts ------------------------------------------------------

export function movingRanges(xs: number[]): number[] {
  return xs.slice(1).map((v, i) => Math.abs(v - xs[i]))
}

/**
 * Individuals & moving range limits. σ is estimated from MR̄/d2 (d2 = 1.128
 * for n = 2), so UCL/LCL = x̄ ± 2.66·MR̄ and MR UCL = 3.267·MR̄.
 */
export function imrLimits(xs: number[]) {
  const { d2, D4 } = XBAR_R_CONSTANTS[2]
  const m = mean(xs)
  const mrs = movingRanges(xs)
  const mrBar = mean(mrs)
  const sigma = mrBar / d2
  return {
    n: xs.length,
    mean: m,
    sigma,
    ucl: m + 3 * sigma,
    lcl: m - 3 * sigma,
    mrBar,
    mrUcl: D4 * mrBar,
    mrLcl: 0,
    movingRanges: mrs,
  }
}

/** X̄-R limits for subgroups of equal size n (2 ≤ n ≤ 10). */
export function xbarRLimits(subgroups: number[][]) {
  const sizes = subgroups.map((g) => g.length)
  const n = sizes.length ? Math.round(mean(sizes)) : 0
  const constants = XBAR_R_CONSTANTS[n]
  const xbars = subgroups.map((g) => mean(g))
  const ranges = subgroups.map((g) => Math.max(...g) - Math.min(...g))
  const xbarBar = mean(xbars)
  const rBar = mean(ranges)
  if (!constants) {
    return {
      supported: false as const,
      n,
      xbars,
      ranges,
      xbarBar,
      rBar,
      sigma: 0,
      ucl: xbarBar,
      lcl: xbarBar,
      rUcl: rBar,
      rLcl: 0,
      unequalSizes: sizes.some((s) => s !== n),
    }
  }
  const halfWidth = constants.A2 * rBar
  return {
    supported: true as const,
    n,
    xbars,
    ranges,
    xbarBar,
    rBar,
    sigma: halfWidth / 3,
    ucl: xbarBar + halfWidth,
    lcl: xbarBar - halfWidth,
    rUcl: constants.D4 * rBar,
    rLcl: constants.D3 * rBar,
    unequalSizes: sizes.some((s) => s !== n),
  }
}

export type NelsonTestId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export const NELSON_TEST_DESCRIPTIONS: Record<NelsonTestId, string> = {
  1: "1 point more than 3σ from the center line",
  2: "9 points in a row on the same side of the center line",
  3: "6 points in a row all increasing or all decreasing",
  4: "14 points in a row alternating up and down",
  5: "2 of 3 points more than 2σ from the center line (same side)",
  6: "4 of 5 points more than 1σ from the center line (same side)",
  7: "15 points in a row within 1σ of the center line (either side)",
  8: "8 points in a row more than 1σ from the center line (either side)",
}

export type NelsonFailure = { test: NelsonTestId; index: number }

/**
 * The eight special-cause tests from the guide's Control chapter (Minitab's
 * defaults). A failure is reported at the index of the point that completes
 * the pattern. `sigma` is the chart's estimated σ (e.g. MR̄/d2).
 */
export function nelsonTests(
  values: number[],
  center: number,
  sigma: number
): NelsonFailure[] {
  const failures: NelsonFailure[] = []
  const n = values.length
  if (n === 0) return failures
  const z = values.map((v) => (sigma > 0 ? (v - center) / sigma : 0))
  const side = z.map((v) => (v > 0 ? 1 : v < 0 ? -1 : 0))

  const push = (test: NelsonTestId, index: number) =>
    failures.push({ test, index })

  for (let i = 0; i < n; i++) {
    // Test 1: beyond 3σ
    if (Math.abs(z[i]) > 3) push(1, i)

    // Test 2: 9 in a row same side
    if (i >= 8) {
      const s = side[i]
      if (s !== 0 && side.slice(i - 8, i + 1).every((v) => v === s)) push(2, i)
    }

    // Test 3: 6 in a row increasing or decreasing
    if (i >= 5) {
      const window = values.slice(i - 5, i + 1)
      const inc = window.every((v, k) => k === 0 || v > window[k - 1])
      const dec = window.every((v, k) => k === 0 || v < window[k - 1])
      if (inc || dec) push(3, i)
    }

    // Test 4: 14 in a row alternating
    if (i >= 13) {
      const window = values.slice(i - 13, i + 1)
      const diffs = window.slice(1).map((v, k) => Math.sign(v - window[k]))
      const alternating =
        diffs.every((d) => d !== 0) &&
        diffs.every((d, k) => k === 0 || d !== diffs[k - 1])
      if (alternating) push(4, i)
    }

    // Test 5: 2 of 3 beyond 2σ, same side
    if (i >= 2) {
      const window = z.slice(i - 2, i + 1)
      const above = window.filter((v) => v > 2).length
      const below = window.filter((v) => v < -2).length
      if (above >= 2 || below >= 2) push(5, i)
    }

    // Test 6: 4 of 5 beyond 1σ, same side
    if (i >= 4) {
      const window = z.slice(i - 4, i + 1)
      const above = window.filter((v) => v > 1).length
      const below = window.filter((v) => v < -1).length
      if (above >= 4 || below >= 4) push(6, i)
    }

    // Test 7: 15 in a row within 1σ
    if (i >= 14) {
      if (z.slice(i - 14, i + 1).every((v) => Math.abs(v) < 1)) push(7, i)
    }

    // Test 8: 8 in a row beyond 1σ, either side
    if (i >= 7) {
      if (z.slice(i - 7, i + 1).every((v) => Math.abs(v) > 1)) push(8, i)
    }
  }
  return failures
}

export type AttributeRow = { n: number; d: number }

/** p chart: proportion defective, subgroup sizes may vary. */
export function pChart(rows: AttributeRow[]) {
  const totalN = sum(rows.map((r) => r.n))
  const totalD = sum(rows.map((r) => r.d))
  const pBar = totalN > 0 ? totalD / totalN : 0
  const points = rows.map((r) => {
    const se = r.n > 0 ? Math.sqrt((pBar * (1 - pBar)) / r.n) : 0
    return {
      value: r.n > 0 ? r.d / r.n : 0,
      ucl: Math.min(pBar + 3 * se, 1),
      lcl: Math.max(pBar - 3 * se, 0),
    }
  })
  return { center: pBar, points }
}

/** np chart: count defective, constant subgroup size. */
export function npChart(rows: AttributeRow[]) {
  const n = rows.length ? mean(rows.map((r) => r.n)) : 0
  const pBar = n > 0 ? mean(rows.map((r) => r.d)) / n : 0
  const center = n * pBar
  const halfWidth = 3 * Math.sqrt(n * pBar * (1 - pBar))
  const points = rows.map((r) => ({
    value: r.d,
    ucl: center + halfWidth,
    lcl: Math.max(center - halfWidth, 0),
  }))
  return { center, points, constantN: rows.every((r) => r.n === rows[0]?.n) }
}

/** c chart: defect count per unit of constant size. */
export function cChart(rows: AttributeRow[]) {
  const cBar = mean(rows.map((r) => r.d))
  const halfWidth = 3 * Math.sqrt(cBar)
  const points = rows.map((r) => ({
    value: r.d,
    ucl: cBar + halfWidth,
    lcl: Math.max(cBar - halfWidth, 0),
  }))
  return {
    center: cBar,
    points,
    constantN: rows.every((r) => r.n === rows[0]?.n),
  }
}

/** u chart: defects per unit, subgroup sizes may vary. */
export function uChart(rows: AttributeRow[]) {
  const totalN = sum(rows.map((r) => r.n))
  const totalD = sum(rows.map((r) => r.d))
  const uBar = totalN > 0 ? totalD / totalN : 0
  const points = rows.map((r) => {
    const se = r.n > 0 ? Math.sqrt(uBar / r.n) : 0
    return {
      value: r.n > 0 ? r.d / r.n : 0,
      ucl: uBar + 3 * se,
      lcl: Math.max(uBar - 3 * se, 0),
    }
  })
  return { center: uBar, points }
}

// --- Student t / hypothesis tests ---------------------------------------

/** log Γ(x) via Lanczos approximation. */
function logGamma(x: number): number {
  const g = 7
  const coef = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  }
  x -= 1
  let a = coef[0]
  const t = x + g + 0.5
  for (let i = 1; i < g + 2; i++) a += coef[i] / (x + i)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

/** Continued fraction for the incomplete beta function (Numerical Recipes). */
function betaContinuedFraction(x: number, a: number, b: number): number {
  const maxIter = 300
  const eps = 3e-14
  const fpmin = 1e-300
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < fpmin) d = fpmin
  d = 1 / d
  let h = d
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < fpmin) d = fpmin
    c = 1 + aa / c
    if (Math.abs(c) < fpmin) c = fpmin
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < fpmin) d = fpmin
    c = 1 + aa / c
    if (Math.abs(c) < fpmin) c = fpmin
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < eps) break
  }
  return h
}

/** Regularized incomplete beta I_x(a, b). */
export function regularizedIncompleteBeta(x: number, a: number, b: number) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const bt = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x)
  )
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(x, a, b)) / a
  }
  return 1 - (bt * betaContinuedFraction(1 - x, b, a)) / b
}

/** Student t CDF: P(T ≤ t) with df degrees of freedom. */
export function studentTCdf(t: number, df: number): number {
  if (df <= 0) return NaN
  const x = df / (df + t * t)
  const tail = 0.5 * regularizedIncompleteBeta(x, df / 2, 0.5)
  return t >= 0 ? 1 - tail : tail
}

/** Two-sided p-value for a t statistic. */
export function tTestPValue(t: number, df: number): number {
  if (!Number.isFinite(t) || df <= 0) return NaN
  const x = df / (df + t * t)
  return regularizedIncompleteBeta(x, df / 2, 0.5)
}

export function oneSampleTTest(xs: number[], mu0: number) {
  const n = xs.length
  const m = mean(xs)
  const sd = stdDev(xs)
  const se = n > 1 && sd > 0 ? sd / Math.sqrt(n) : 0
  const t = se > 0 ? (m - mu0) / se : 0
  const df = n - 1
  const p = n > 1 && se > 0 ? tTestPValue(t, df) : NaN
  return { n, mean: m, stdDev: sd, se, t, df, p }
}

/** Welch's two-sample t test (unequal variances). */
export function twoSampleTTest(xs: number[], ys: number[]) {
  const n1 = xs.length
  const n2 = ys.length
  const m1 = mean(xs)
  const m2 = mean(ys)
  const s1 = stdDev(xs)
  const s2 = stdDev(ys)
  const v1 = n1 > 0 ? (s1 * s1) / n1 : 0
  const v2 = n2 > 0 ? (s2 * s2) / n2 : 0
  const se = Math.sqrt(v1 + v2)
  const t = se > 0 ? (m1 - m2) / se : 0
  const df =
    n1 > 1 && n2 > 1 && se > 0
      ? (v1 + v2) ** 2 / ((v1 * v1) / (n1 - 1) + (v2 * v2) / (n2 - 1))
      : 0
  const p = df > 0 ? tTestPValue(t, df) : NaN
  return {
    n1,
    n2,
    mean1: m1,
    mean2: m2,
    stdDev1: s1,
    stdDev2: s2,
    diff: m1 - m2,
    se,
    t,
    df,
    p,
  }
}

// --- Sample size ---------------------------------------------------------

/** Two-sided z for a given alpha (e.g. 0.05 → 1.96). */
export function zForAlpha(alpha: number): number {
  return normalQuantile(1 - alpha / 2)
}

/** One-sided z for a given power (e.g. 0.8 → 0.84). */
export function zForPower(power: number): number {
  return normalQuantile(power)
}

/** n to estimate a mean within ±E: n = (z·σ / E)². */
export function sampleSizeForMean(
  sd: number,
  marginOfError: number,
  alpha: number
) {
  if (sd <= 0 || marginOfError <= 0) return 0
  return Math.ceil(((zForAlpha(alpha) * sd) / marginOfError) ** 2)
}

/** n to estimate a proportion within ±E: n = z²·p(1−p) / E². */
export function sampleSizeForProportion(
  p: number,
  marginOfError: number,
  alpha: number
) {
  if (marginOfError <= 0 || p < 0 || p > 1) return 0
  const z = zForAlpha(alpha)
  return Math.ceil((z * z * p * (1 - p)) / (marginOfError * marginOfError))
}

/** n per group to detect a mean difference δ: n = 2·((zα/2 + zβ)·σ / δ)². */
export function sampleSizeForMeanDifference(
  sd: number,
  delta: number,
  alpha: number,
  power: number,
  groups: 1 | 2 = 2
) {
  if (sd <= 0 || delta <= 0) return 0
  const z = zForAlpha(alpha) + zForPower(power)
  const n = ((z * sd) / delta) ** 2
  return Math.ceil(groups === 2 ? 2 * n : n)
}

// --- Pareto --------------------------------------------------------------

export type ParetoItem = { name: string; count: number }

/**
 * Ranks categories by count and returns cumulative percentages. `vitalFewCount`
 * is the number of categories needed to reach 80 % of the total, including the
 * category that crosses the line.
 */
export function pareto(items: ParetoItem[], threshold = 80) {
  const ranked = items
    .filter((i) => i.count > 0)
    .sort((a, b) => b.count - a.count)
  const total = sum(ranked.map((r) => r.count))
  const rows = ranked.reduce<
    (ParetoItem & { pct: number; cumulativePct: number })[]
  >((acc, r) => {
    const running = acc.at(-1)?.cumulativePct ?? 0
    const pct = total > 0 ? (r.count / total) * 100 : 0
    acc.push({ ...r, pct, cumulativePct: running + pct })
    return acc
  }, [])
  const crossing = rows.findIndex((r) => r.cumulativePct >= threshold - 1e-9)
  const vitalFewCount =
    rows.length === 0 ? 0 : crossing === -1 ? rows.length : crossing + 1
  return { rows, total, vitalFewCount }
}

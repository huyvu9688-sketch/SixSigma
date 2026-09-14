// Checks lib/six-sigma/stats.ts against worked examples from
// ref/Six-Sigma-A-Complete-Step-by-Step-Guide.md. Run with:
//   npm run verify:stats
import assert from "node:assert/strict"
import {
  capability,
  cChart,
  dpmo,
  dpmoFromSigma,
  imrLimits,
  nelsonTests,
  normalQuantile,
  pareto,
  pChart,
  rolledThroughputYield,
  sampleSizeForMean,
  sigmaFromDpmo,
  stdDev,
  tTestPValue,
  twoSampleTTest,
  uChart,
  xbarRLimits,
  zForAlpha,
} from "../lib/six-sigma/stats"

const close = (a: number, b: number, tol: number, msg: string) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b}`)

// Sigma table (guide p.11): 1σ 690,000 · 2σ 308,000 · 3σ 66,800 · 4σ 6,200 · 5σ 233 · 6σ 3.4
close(dpmoFromSigma(1), 691_462, 1_000, "1σ DPMO")
close(dpmoFromSigma(2), 308_538, 600, "2σ DPMO")
close(dpmoFromSigma(3), 66_807, 100, "3σ DPMO")
close(dpmoFromSigma(4), 6_210, 20, "4σ DPMO")
close(dpmoFromSigma(5), 233, 2, "5σ DPMO")
close(dpmoFromSigma(6), 3.4, 0.1, "6σ DPMO")
// Abridged yield table (guide p.13): 4,550 DPMO → 4.1σ, 6,210 → 4.0σ
close(sigmaFromDpmo(4_550), 4.1, 0.01, "4,550 DPMO → 4.1σ")
close(sigmaFromDpmo(6_210), 4.0, 0.01, "6,210 DPMO → 4.0σ")
close(sigmaFromDpmo(dpmoFromSigma(3.7)), 3.7, 1e-5, "round trip sigma")

// DPMO example (guide p.80): 2 defects / (90 forms × 10 fields) → 2,222
close(dpmo(2, 90, 10), 2_222.2, 0.1, "DPMO forms")

// FTY / RTY chain (guide p.81–82)
const chain = rolledThroughputYield([
  { entering: 100, scrap: 5, rework: 5 },
  { entering: 95, scrap: 10, rework: 5 },
  { entering: 85, scrap: 5, rework: 15 },
])
close(chain.overallFty, 0.8, 0.01, "overall FTY ≈ 0.79–0.80")
// The guide multiplies rounded step yields (0.9 × 0.84 × 0.76 = 0.574); the
// unrounded product is 0.5796.
close(chain.overallRty, 0.574, 0.01, "overall RTY ≈ 0.574")

// Sigma level & Cpk (guide p.241): USL 5, LSL 3, σ .25, median 4.2 → 3.2σ, Cpk 1.06
const cap = capability({ usl: 5, lsl: 3, mean: 4.2, stdDev: 0.25 })
close(cap.sigmaLevel, 3.2, 1e-9, "sigma level from spec")
close(cap.cpk, 1.0667, 0.001, "Cpk")

// I-MR: UCL = x̄ + 2.66·MR̄, MR UCL = 3.267·MR̄ (guide p.436: x̄ 19.28, MR̄ 2.164 → 25.04 / 7.071)
const imr = imrLimits([1, 2, 3])
close(imr.ucl - imr.mean, 2.66 * imr.mrBar, 1e-2, "I chart 2.66 factor")
close(19.28 + 2.66 * 2.164, 25.04, 0.01, "guide I-MR UCL")
close(3.267 * 2.164, 7.071, 0.01, "guide MR UCL")

// p chart (guide p.437–440): 20 samples of 100, 43 defects → p̄ 0.0215, UCL 0.0650
const pRows = [5, 2, 1, 0, 0, 2, 1, 0, 6, 0, 7, 0, 9, 0, 0, 1, 2, 0, 7, 0].map(
  (d) => ({ n: 100, d })
)
const p = pChart(pRows)
close(p.center, 0.0215, 1e-6, "p̄")
close(p.points[0].ucl, 0.065, 0.0005, "p UCL")

// c chart (guide p.448): 21 samples → c̄ 14.10, UCL 25.36, LCL 2.83
const c = cChart(
  [
    8, 2, 12, 15, 22, 6, 8, 14, 9, 23, 24, 26, 10, 7, 5, 12, 15, 18, 19, 14, 27,
  ].map((d) => ({ n: 10, d }))
)
close(c.center, 14.1, 0.01, "c̄")
close(c.points[0].ucl, 25.36, 0.01, "c UCL")
close(c.points[0].lcl, 2.83, 0.01, "c LCL")

// u chart (guide p.450): errors 26 over 115 calls → ū 0.2261
const u = uChart(
  [
    [15, 3],
    [13, 5],
    [18, 4],
    [10, 0],
    [12, 2],
    [9, 2],
    [11, 4],
    [12, 5],
    [8, 0],
    [7, 1],
  ].map(([n, d]) => ({ n, d }))
)
close(u.center, 0.2261, 0.0001, "ū")

// X̄-R with n = 5: A2 = 0.577
const xr = xbarRLimits([
  [1, 2, 3, 4, 5],
  [2, 3, 4, 5, 6],
])
assert.ok(xr.supported, "n=5 supported")
close(xr.ucl - xr.xbarBar, 0.577 * xr.rBar, 1e-9, "A2 factor")

// Nelson tests
const flat = Array(20).fill(10)
assert.equal(
  nelsonTests(flat, 10, 1).filter((f) => f.test === 7).length,
  6,
  "test 7 fires from point 15"
)
const spike = [...Array(10).fill(10), 14]
assert.deepEqual(
  nelsonTests(spike, 10, 1).filter((f) => f.test === 1),
  [{ test: 1, index: 10 }],
  "test 1"
)
const run = Array(9).fill(11)
assert.ok(
  nelsonTests(run, 10, 1).some((f) => f.test === 2 && f.index === 8),
  "test 2"
)
const trend = [1, 2, 3, 4, 5, 6]
assert.ok(
  nelsonTests(trend, 3.5, 10).some((f) => f.test === 3 && f.index === 5),
  "test 3"
)

// Normal quantile and z
close(normalQuantile(0.975), 1.959964, 1e-5, "z 0.975")
close(zForAlpha(0.05), 1.96, 0.001, "z alpha 0.05")
close(normalQuantile(0.8), 0.8416, 1e-3, "z power 0.8")

// t distribution: t = 2.0, df = 10 → two-sided p ≈ 0.0734
close(tTestPValue(2.0, 10), 0.0734, 0.001, "t p-value")
const tt = twoSampleTTest([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])
close(tt.t, 0, 1e-12, "identical samples t = 0")
close(tt.p, 1, 1e-9, "identical samples p = 1")

// Sample size: n = (1.96 × 2 / 0.5)² = 61.5 → 62
assert.equal(sampleSizeForMean(2, 0.5, 0.05), 62, "sample size mean")

// stdDev sample vs population (guide test-score example: population σ 9.987)
close(
  stdDev([10, 12, 23, 23, 16, 23, 21, 16], false),
  4.898979,
  1e-5,
  "population sd"
)

// Pareto vital few includes the crossing category
const pa = pareto([
  { name: "A", count: 420 },
  { name: "B", count: 260 },
  { name: "C", count: 150 },
  { name: "D", count: 90 },
])
assert.equal(pa.vitalFewCount, 3, "vital few crosses 80% at C")

console.log("verify-stats: all checks passed")

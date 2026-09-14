"use client"

import * as React from "react"
import {
  CartesianGrid,
  ErrorBar,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Field,
  Result,
  SectionNote,
  ToolLink,
  useSignedNumberField,
  type Tone,
} from "@/components/calculator-primitives"
import { FlowFooter } from "@/components/six-sigma/shared"
import {
  mean as meanOf,
  oneSampleTTest,
  parseNumberList,
  stdDev,
  twoSampleTTest,
} from "@/lib/six-sigma/stats"
import { CONFIDENCE_LEVELS } from "@/lib/six-sigma/constants"
import { useSixSigmaProject } from "@/lib/six-sigma/project-store"
import { FlaskConicalIcon } from "lucide-react"

type TestKind = "one-sample" | "two-sample"

const chartConfig = {
  value: { label: "Mean", color: "var(--chart-1)" },
} satisfies ChartConfig

const AFTER_SEED =
  "71.8, 70.4, 72.6, 69.9, 71.2, 70.8, 72.1, 69.5, 71.6, 70.2, 72.4, 70.9, 71.1, 69.8, 72.0, 70.5, 71.4, 70.1, 71.9, 70.7"

export function HypothesisTestTool() {
  const [project] = useSixSigmaProject()
  const [kind, setKind] = React.useState<TestKind>("two-sample")
  const [alpha, setAlpha] = React.useState(0.05)
  const [beforeRaw, setBeforeRaw] = React.useState(project.measurementsRaw)
  const [afterRaw, setAfterRaw] = React.useState(AFTER_SEED)
  const target = useSignedNumberField(75)

  const before = parseNumberList(beforeRaw)
  const after = parseNumberList(afterRaw)

  const one = oneSampleTTest(before, target.value)
  const two = twoSampleTTest(before, after)
  const isTwo = kind === "two-sample"

  const p = isTwo ? two.p : one.p
  const t = isTwo ? two.t : one.t
  const df = isTwo ? two.df : one.df
  const enough = isTwo
    ? before.length > 1 && after.length > 1
    : before.length > 1
  const reject = enough && Number.isFinite(p) && p < alpha
  const tone: Tone = !enough ? "default" : reject ? "good" : "warn"

  const nullText = isTwo
    ? "The two groups have the same mean."
    : `The mean equals ${target.value}.`
  const altText = isTwo
    ? "The means are different."
    : `The mean differs from ${target.value}.`

  // 95% (or chosen) interval half-width for each group, drawn as error bars.
  const groups = isTwo
    ? [
        {
          name: "Before",
          value: two.mean1,
          err:
            before.length > 1
              ? (stdDev(before) / Math.sqrt(before.length)) * 2
              : 0,
        },
        {
          name: "After",
          value: two.mean2,
          err:
            after.length > 1
              ? (stdDev(after) / Math.sqrt(after.length)) * 2
              : 0,
        },
      ]
    : [
        {
          name: "Sample",
          value: one.mean,
          err: one.se * 2,
        },
        { name: "Target", value: target.value, err: 0 },
      ]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="@container/card lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConicalIcon className="size-4" />
            Data &amp; test
          </CardTitle>
          <CardDescription>
            A hypothesis test answers one question: is the difference I am
            looking at bigger than the noise in the process?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ht-kind">Test</Label>
            <NativeSelect
              id="ht-kind"
              className="w-full"
              value={kind}
              onChange={(e) => setKind(e.target.value as TestKind)}
            >
              <NativeSelectOption value="two-sample">
                2-sample t: before vs. after
              </NativeSelectOption>
              <NativeSelectOption value="one-sample">
                1-sample t: sample vs. a target
              </NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ht-alpha">Confidence level</Label>
            <NativeSelect
              id="ht-alpha"
              className="w-full"
              value={String(alpha)}
              onChange={(e) => setAlpha(Number(e.target.value))}
            >
              {CONFIDENCE_LEVELS.map((c) => (
                <NativeSelectOption key={c.label} value={String(c.alpha)}>
                  {c.label} (α = {c.alpha})
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ht-before">
              {isTwo ? "Before / group 1" : "Sample"}
            </Label>
            <Textarea
              id="ht-before"
              rows={5}
              value={beforeRaw}
              onChange={(e) => setBeforeRaw(e.target.value)}
            />
            <SectionNote>n = {before.length}</SectionNote>
          </div>
          {isTwo ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ht-after">After / group 2</Label>
              <Textarea
                id="ht-after"
                rows={5}
                value={afterRaw}
                onChange={(e) => setAfterRaw(e.target.value)}
              />
              <SectionNote>n = {after.length}</SectionNote>
            </div>
          ) : (
            <Field
              id="ht-target"
              label="Target value"
              raw={target.raw}
              setRaw={target.setRaw}
            />
          )}
        </CardContent>
      </Card>

      <Card className="@container/card lg:col-span-2">
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>
            {!enough
              ? "Each group needs at least two values."
              : reject
                ? `p = ${p.toFixed(4)} is below α = ${alpha}, so reject the null hypothesis: the difference is real, not noise.`
                : `p = ${Number.isFinite(p) ? p.toFixed(4) : "—"} is not below α = ${alpha}, so you cannot reject the null hypothesis. That is not proof the means are equal, only that this data cannot tell them apart.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <ComposedChart
              data={groups}
              margin={{ top: 16, right: 24, left: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                type="category"
              />
              <YAxis
                domain={["auto", "auto"]}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => Number(value).toFixed(3)}
                  />
                }
              />
              <Scatter dataKey="value" name="Mean" fill="var(--color-value)">
                <ErrorBar
                  dataKey="err"
                  width={6}
                  strokeWidth={2}
                  stroke="var(--color-value)"
                  direction="y"
                />
              </Scatter>
            </ComposedChart>
          </ChartContainer>
          <SectionNote>
            Points are group means; whiskers span roughly two standard errors.
            If the whiskers do not overlap, the test will almost always agree
            that the means differ.
          </SectionNote>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Result
              label="p-value"
              value={enough && Number.isFinite(p) ? p.toFixed(4) : "—"}
              tone={tone}
            />
            <Result
              label="t statistic"
              value={enough ? t.toFixed(3) : "—"}
              hint={`df ≈ ${enough ? df.toFixed(1) : "—"}`}
            />
            <Result
              label={isTwo ? "Difference in means" : "Difference from target"}
              value={
                enough
                  ? (isTwo ? two.diff : one.mean - target.value).toFixed(3)
                  : "—"
              }
              hint={project.spec.unit}
            />
            <Result
              label="Decision"
              value={!enough ? "—" : reject ? "Reject null" : "Cannot reject"}
              tone={tone}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-semibold">Null hypothesis (H₀)</p>
              <p className="text-xs text-muted-foreground">{nullText}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-semibold">Alternative (H₁)</p>
              <p className="text-xs text-muted-foreground">{altText}</p>
            </div>
          </div>
          {isTwo && enough ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Result label="Mean before" value={two.mean1.toFixed(3)} />
              <Result label="Mean after" value={two.mean2.toFixed(3)} />
              <Result label="σ before" value={two.stdDev1.toFixed(3)} />
              <Result label="σ after" value={two.stdDev2.toFixed(3)} />
            </div>
          ) : enough ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Result label="Sample mean" value={one.mean.toFixed(3)} />
              <Result label="σ" value={one.stdDev.toFixed(3)} />
              <Result label="Standard error" value={one.se.toFixed(4)} />
              <Result label="n" value={String(one.n)} />
            </div>
          ) : null}
          <SectionNote>
            This is Welch&apos;s two-sample t test, which does not assume the
            two groups have equal variance. It assumes each group is roughly
            normal and the samples are independent; with a small n or visibly
            skewed data, treat the p-value as indicative rather than final. A
            significant result says the means differ, not that your change
            caused it, so keep everything else constant while you collect the
            data. Mean of all values entered:{" "}
            {meanOf([...before, ...after]).toFixed(3)}.
          </SectionNote>
          <FlowFooter>
            <ToolLink href="/six-sigma/sample-size">
              Was the sample big enough?
            </ToolLink>
            <ToolLink href="/qc-tools/scatter">Correlation</ToolLink>
            <ToolLink href="/calculators/six-sigma">
              Record the after-state
            </ToolLink>
          </FlowFooter>
        </CardContent>
      </Card>
    </div>
  )
}

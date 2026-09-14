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
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Field,
  Result,
  SectionNote,
  ToolLink,
  fmt,
  useNumberField,
} from "@/components/calculator-primitives"
import { FlowFooter } from "@/components/six-sigma/shared"
import {
  parseNumberList,
  sampleSizeForMean,
  sampleSizeForMeanDifference,
  sampleSizeForProportion,
  stdDev,
  zForAlpha,
  zForPower,
} from "@/lib/six-sigma/stats"
import { CONFIDENCE_LEVELS, POWER_LEVELS } from "@/lib/six-sigma/constants"
import { useSixSigmaProject } from "@/lib/six-sigma/project-store"
import { CalculatorIcon, ListChecksIcon } from "lucide-react"

type Goal = "estimate-mean" | "estimate-proportion" | "detect-difference"

const GOALS: { value: Goal; label: string; test: string }[] = [
  {
    value: "estimate-mean",
    label: "Estimate an average within a margin of error",
    test: "1-sample t / Z confidence interval",
  },
  {
    value: "estimate-proportion",
    label: "Estimate a rate or percentage within a margin of error",
    test: "1-sample proportion confidence interval",
  },
  {
    value: "detect-difference",
    label: "Detect a difference between before and after",
    test: "2-sample t test",
  },
]

const SAMPLING_STRATEGIES = [
  {
    name: "Simple random",
    use: "Every unit has an equal chance of being picked.",
    risk: "Can miss a subgroup entirely if the population is not uniform.",
  },
  {
    name: "Stratified",
    use: "Split the population into subgroups that differ, then sample each one at random.",
    risk: "Needs to know which attribute matters; a wrong split adds no protection.",
  },
  {
    name: "Sequential",
    use: "Take every Nth unit, or one every N minutes.",
    risk: "Can sync up with a repeating pattern in the process and hide it.",
  },
]

export function SampleSizeTool() {
  const [project] = useSixSigmaProject()
  const [goal, setGoal] = React.useState<Goal>("estimate-mean")
  const [alpha, setAlpha] = React.useState(0.05)
  const [power, setPower] = React.useState(0.8)

  const projectValues = parseNumberList(project.measurementsRaw)
  const projectSd = stdDev(projectValues)

  const sd = useNumberField(Number(projectSd.toFixed(3)) || 2.5)
  const margin = useNumberField(1)
  const proportion = useNumberField(5)
  const marginPct = useNumberField(1)
  const delta = useNumberField(2)

  const nMean = sampleSizeForMean(sd.value, margin.value, alpha)
  const nProportion = sampleSizeForProportion(
    proportion.value / 100,
    marginPct.value / 100,
    alpha
  )
  const nDifference = sampleSizeForMeanDifference(
    sd.value,
    delta.value,
    alpha,
    power,
    2
  )

  const chosen =
    goal === "estimate-mean"
      ? nMean
      : goal === "estimate-proportion"
        ? nProportion
        : nDifference
  const perGroup = goal === "detect-difference"

  // How the required n changes if the tolerance is loosened or tightened.
  const sensitivity = [0.5, 0.75, 1, 1.5, 2].map((factor) => {
    if (goal === "estimate-mean") {
      return {
        factor,
        label: `${(margin.value * factor).toFixed(2)} ${project.spec.unit || "units"}`,
        n: sampleSizeForMean(sd.value, margin.value * factor, alpha),
      }
    }
    if (goal === "estimate-proportion") {
      return {
        factor,
        label: `±${(marginPct.value * factor).toFixed(2)}%`,
        n: sampleSizeForProportion(
          proportion.value / 100,
          (marginPct.value * factor) / 100,
          alpha
        ),
      }
    }
    return {
      factor,
      label: `${(delta.value * factor).toFixed(2)} ${project.spec.unit || "units"}`,
      n: sampleSizeForMeanDifference(
        sd.value,
        delta.value * factor,
        alpha,
        power,
        2
      ),
    }
  })

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="@container/card lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalculatorIcon className="size-4" />
            What are you trying to learn?
          </CardTitle>
          <CardDescription>
            The question decides the formula. Sampling more than you need costs
            money; sampling less risks a conclusion you cannot defend.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ss-goal">Goal</Label>
            <NativeSelect
              id="ss-goal"
              className="w-full"
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
            >
              {GOALS.map((g) => (
                <NativeSelectOption key={g.value} value={g.value}>
                  {g.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <SectionNote>
              Matching test: {GOALS.find((g) => g.value === goal)?.test}
            </SectionNote>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ss-alpha">Confidence level</Label>
              <NativeSelect
                id="ss-alpha"
                className="w-full"
                value={String(alpha)}
                onChange={(e) => setAlpha(Number(e.target.value))}
              >
                {CONFIDENCE_LEVELS.map((c) => (
                  <NativeSelectOption key={c.label} value={String(c.alpha)}>
                    {c.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            {goal === "detect-difference" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ss-power">Power</Label>
                <NativeSelect
                  id="ss-power"
                  className="w-full"
                  value={String(power)}
                  onChange={(e) => setPower(Number(e.target.value))}
                >
                  {POWER_LEVELS.map((p) => (
                    <NativeSelectOption key={p.label} value={String(p.power)}>
                      {p.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            ) : null}
          </div>

          {goal === "estimate-proportion" ? (
            <>
              <Field
                id="ss-proportion"
                label="Expected rate"
                suffix="%"
                raw={proportion.raw}
                setRaw={proportion.setRaw}
              />
              <Field
                id="ss-margin-pct"
                label="Acceptable margin of error"
                suffix="%"
                raw={marginPct.raw}
                setRaw={marginPct.setRaw}
              />
            </>
          ) : (
            <>
              <Field
                id="ss-sd"
                label="Process std deviation (σ)"
                raw={sd.raw}
                setRaw={sd.setRaw}
              />
              {goal === "estimate-mean" ? (
                <Field
                  id="ss-margin"
                  label="Acceptable margin of error (±)"
                  raw={margin.raw}
                  setRaw={margin.setRaw}
                />
              ) : (
                <Field
                  id="ss-delta"
                  label="Difference worth detecting"
                  raw={delta.raw}
                  setRaw={delta.setRaw}
                />
              )}
            </>
          )}
          {projectValues.length > 1 ? (
            <SectionNote>
              The project data set has n = {projectValues.length} with σ ={" "}
              {projectSd.toFixed(3)}, which is a reasonable starting estimate.
            </SectionNote>
          ) : null}
        </CardContent>
      </Card>

      <Card className="@container/card lg:col-span-2">
        <CardHeader>
          <CardTitle>Required sample size</CardTitle>
          <CardDescription>
            {perGroup
              ? `Collect ${fmt.num(chosen)} measurements in each group, before and after.`
              : `Collect ${fmt.num(chosen)} measurements.`}{" "}
            Alpha is the risk of claiming a change that is not real; beta is the
            risk of missing one that is.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Result
              label={perGroup ? "n per group" : "n"}
              value={chosen > 0 ? fmt.num(chosen) : "—"}
              tone={chosen > 0 ? "good" : "default"}
            />
            <Result
              label="Total measurements"
              value={chosen > 0 ? fmt.num(perGroup ? chosen * 2 : chosen) : "—"}
            />
            <Result
              label="z for confidence"
              value={zForAlpha(alpha).toFixed(3)}
              hint={`α = ${alpha}`}
            />
            <Result
              label={perGroup ? "z for power" : "Type II risk"}
              value={perGroup ? zForPower(power).toFixed(3) : `β not set`}
              hint={
                perGroup ? `β = ${(1 - power).toFixed(2)}` : "estimation only"
              }
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">
              How the requirement moves with your tolerance
            </p>
            <Table>
              <TableHeader>
                <TableRow className="text-xs text-muted-foreground">
                  <TableHead>
                    {goal === "detect-difference"
                      ? "Difference to detect"
                      : "Margin of error"}
                  </TableHead>
                  <TableHead>{perGroup ? "n per group" : "n"}</TableHead>
                  <TableHead>vs. your setting</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sensitivity.map((s) => (
                  <TableRow
                    key={s.factor}
                    className={s.factor === 1 ? "bg-muted/40 font-medium" : ""}
                  >
                    <TableCell>{s.label}</TableCell>
                    <TableCell className="tabular-nums">
                      {s.n > 0 ? fmt.num(s.n) : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {s.factor === 1
                        ? "your setting"
                        : chosen > 0
                          ? `${s.n > chosen ? "+" : ""}${fmt.num(s.n - chosen)}`
                          : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <SectionNote className="mt-2">
              Halving the margin of error roughly quadruples the sample, because
              n scales with the square of the tolerance.
            </SectionNote>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ListChecksIcon className="size-4" />
              Pick a sampling strategy too
            </p>
            <Table>
              <TableHeader>
                <TableRow className="text-xs text-muted-foreground">
                  <TableHead>Strategy</TableHead>
                  <TableHead>Use it when</TableHead>
                  <TableHead>Watch out for</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SAMPLING_STRATEGIES.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="whitespace-normal">{s.use}</TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {s.risk}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <SectionNote className="mt-2">
              Attribute (pass/fail) data needs a larger sample than measured
              data to reach the same confidence, which is one reason to measure
              rather than to judge wherever you can.
            </SectionNote>
          </div>

          <FlowFooter>
            <ToolLink href="/six-sigma/gage-rr">
              Check the measurement system first
            </ToolLink>
            <ToolLink href="/six-sigma/hypothesis-test">
              Hypothesis test
            </ToolLink>
          </FlowFooter>
        </CardContent>
      </Card>
    </div>
  )
}

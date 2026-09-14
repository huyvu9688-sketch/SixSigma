"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Field,
  Result,
  SectionNote,
  ToolLink,
  fmt,
  type Tone,
} from "@/components/calculator-primitives"
import { FlowFooter } from "@/components/six-sigma/shared"
import { summarize } from "@/components/six-sigma/sigma-level"
import { toNonNegative } from "@/lib/six-sigma/stats"
import { COQ_PERCENT_OF_SALES_BY_SIGMA } from "@/lib/six-sigma/constants"
import {
  useSixSigmaProject,
  type CostOfQuality,
  type Project,
} from "@/lib/six-sigma/project-store"
import { CoinsIcon, LayersIcon } from "lucide-react"

const chartConfig = {
  amount: { label: "Cost" },
} satisfies ChartConfig

function numbers(copq: CostOfQuality) {
  const externalFailure = toNonNegative(copq.externalFailure)
  const internalFailure = toNonNegative(copq.internalFailure)
  const prevention = toNonNegative(copq.prevention)
  const appraisal = toNonNegative(copq.appraisal)
  const sales = toNonNegative(copq.sales)
  // CoPQ = external + internal failure costs. CoQ adds the conformity costs.
  const costOfPoorQuality = externalFailure + internalFailure
  const costOfQuality = costOfPoorQuality + prevention + appraisal
  return {
    externalFailure,
    internalFailure,
    prevention,
    appraisal,
    sales,
    costOfPoorQuality,
    costOfQuality,
    copqPctOfSales: sales > 0 ? (costOfPoorQuality / sales) * 100 : 0,
    coqPctOfSales: sales > 0 ? (costOfQuality / sales) * 100 : 0,
  }
}

/** The sigma band whose CoQ-as-percent-of-sales range contains this figure. */
function impliedSigmaBand(coqPct: number) {
  return (
    COQ_PERCENT_OF_SALES_BY_SIGMA.find(
      (band) => coqPct > band.low && coqPct <= band.high
    ) ?? COQ_PERCENT_OF_SALES_BY_SIGMA[COQ_PERCENT_OF_SALES_BY_SIGMA.length - 1]
  )
}

function InputsCard({
  project,
  update,
}: {
  project: Project
  update: (u: (p: Project) => Project) => void
}) {
  const set = (patch: Partial<CostOfQuality>) =>
    update((p) => ({ ...p, copq: { ...p.copq, ...patch } }))
  return (
    <Card className="@container/card lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CoinsIcon className="size-4" />
          Quality costs
        </CardTitle>
        <CardDescription>
          Costs for the same period as the baseline. Failure costs are
          nonconformity; prevention and appraisal are conformity.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field
          id="copq-external"
          label="External failure (returns, warranty, lost sales)"
          suffix="$"
          raw={project.copq.externalFailure}
          setRaw={(externalFailure) => set({ externalFailure })}
        />
        <Field
          id="copq-internal"
          label="Internal failure (scrap, rework, repair)"
          suffix="$"
          raw={project.copq.internalFailure}
          setRaw={(internalFailure) => set({ internalFailure })}
        />
        <Field
          id="copq-prevention"
          label="Prevention (error-proofing, training, planning)"
          suffix="$"
          raw={project.copq.prevention}
          setRaw={(prevention) => set({ prevention })}
        />
        <Field
          id="copq-appraisal"
          label="Appraisal (inspection, audits, calibration)"
          suffix="$"
          raw={project.copq.appraisal}
          setRaw={(appraisal) => set({ appraisal })}
        />
        <Field
          id="copq-sales"
          label="Sales for the same period"
          suffix="$"
          raw={project.copq.sales}
          setRaw={(sales) => set({ sales })}
        />
        <SectionNote>
          CoPQ = external + internal failure costs. CoQ = CoPQ + prevention +
          appraisal. Visible costs are the tip of the iceberg: lost loyalty,
          morale, rescheduling and admin overhead rarely make it into the total.
        </SectionNote>
      </CardContent>
    </Card>
  )
}

function ResultsCard({ project }: { project: Project }) {
  const n = numbers(project.copq)
  const baseline = summarize(project.baseline)
  const band = impliedSigmaBand(n.coqPctOfSales)
  const tone: Tone =
    n.coqPctOfSales <= 5 ? "good" : n.coqPctOfSales <= 15 ? "warn" : "bad"

  const data = [
    { name: "External failure", amount: n.externalFailure, group: "poor" },
    { name: "Internal failure", amount: n.internalFailure, group: "poor" },
    { name: "Appraisal", amount: n.appraisal, group: "good" },
    { name: "Prevention", amount: n.prevention, group: "good" },
  ]

  return (
    <Card className="@container/card lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayersIcon className="size-4" />
          Cost of quality
        </CardTitle>
        <CardDescription>
          {n.sales > 0
            ? `Quality costs are ${n.coqPctOfSales.toFixed(1)}% of sales, which is the range a ${band.sigma}σ process typically runs at (${band.range}).`
            : "Enter sales to compare against the sigma-level benchmark."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 32 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => fmt.money(Number(v))}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => fmt.money(Number(value))}
                />
              }
            />
            <Bar dataKey="amount" name="Cost" radius={4} barSize={24}>
              {data.map((d) => (
                <Cell
                  key={d.name}
                  fill={
                    d.group === "poor" ? "var(--destructive)" : "var(--chart-2)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Result
            label="Cost of poor quality"
            value={fmt.money(n.costOfPoorQuality)}
            tone="bad"
          />
          <Result label="Cost of quality" value={fmt.money(n.costOfQuality)} />
          <Result
            label="CoQ % of sales"
            value={n.sales > 0 ? `${n.coqPctOfSales.toFixed(1)}%` : "—"}
            tone={n.sales > 0 ? tone : "default"}
          />
          <Result
            label="Defect cost from baseline"
            value={baseline.hasData ? fmt.money(baseline.cost) : "—"}
            hint={
              baseline.hasData
                ? `${fmt.num(baseline.defects)} defects × ${fmt.money(baseline.costPerDefect)}`
                : "set a baseline"
            }
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow className="text-xs text-muted-foreground">
              <TableHead>Sigma level</TableHead>
              <TableHead>Cost of quality as % of sales</TableHead>
              <TableHead>At your sales figure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COQ_PERCENT_OF_SALES_BY_SIGMA.map((row) => (
              <TableRow
                key={row.sigma}
                className={
                  row.sigma === band.sigma && n.sales > 0
                    ? "bg-muted/40 font-medium"
                    : ""
                }
              >
                <TableCell className="tabular-nums">{row.sigma}σ</TableCell>
                <TableCell>{row.range}</TableCell>
                <TableCell className="tabular-nums">
                  {n.sales > 0
                    ? `${fmt.money((n.sales * row.low) / 100)} – ${fmt.money((n.sales * row.high) / 100)}`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <SectionNote>
          In a Six Sigma organization prevention and appraisal costs fall as the
          sigma level rises, so CoQ and CoPQ go down together rather than
          trading off against each other.
        </SectionNote>
        <FlowFooter label="Use this in">
          <ToolLink href="/six-sigma/charter">Charter business case</ToolLink>
          <ToolLink href="/six-sigma">Project hub</ToolLink>
        </FlowFooter>
      </CardContent>
    </Card>
  )
}

export function CostOfQualityTool() {
  const [project, update] = useSixSigmaProject()
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <InputsCard project={project} update={update} />
      <ResultsCard project={project} />
    </div>
  )
}

"use client"

import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Result,
  SectionNote,
  SendButton,
  ToolLink,
} from "@/components/calculator-primitives"
import { FlowFooter } from "@/components/six-sigma/shared"
import { newId, useSixSigmaProject } from "@/lib/six-sigma/project-store"
import { PlusIcon, XIcon, Grid2x2CheckIcon } from "lucide-react"

type Period = { id: string; label: string }
type CategoryRow = { id: string; name: string; counts: Record<string, string> }

const SEED_PERIODS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const SEED_CATEGORIES: { name: string; counts: number[] }[] = [
  { name: "Scratches", counts: [12, 15, 9, 14, 8] },
  { name: "Stain blotching", counts: [6, 4, 8, 5, 9] },
  { name: "Drips / runs", counts: [3, 2, 5, 3, 4] },
  { name: "Dust nibs", counts: [2, 3, 1, 2, 3] },
  { name: "Contamination", counts: [0, 1, 0, 0, 1] },
]

function useCheckSheet() {
  const periodIdCounter = React.useRef(SEED_PERIODS.length)
  const nextPeriodId = () => `period-${++periodIdCounter.current}`
  const [periods, setPeriods] = React.useState<Period[]>(() =>
    SEED_PERIODS.map((label, i) => ({ id: `period-${i + 1}`, label }))
  )

  const categoryIdCounter = React.useRef(SEED_CATEGORIES.length)
  const nextCategoryId = () => `category-${++categoryIdCounter.current}`
  const [categories, setCategories] = React.useState<CategoryRow[]>(() =>
    SEED_CATEGORIES.map((c, i) => ({
      id: `category-${i + 1}`,
      name: c.name,
      counts: Object.fromEntries(
        c.counts.map((n, pi) => [`period-${pi + 1}`, String(n)])
      ),
    }))
  )

  const addPeriod = () =>
    setPeriods((prev) => [
      ...prev,
      { id: nextPeriodId(), label: `Period ${prev.length + 1}` },
    ])
  const removePeriod = (id: string) => {
    setPeriods((prev) => prev.filter((p) => p.id !== id))
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        counts: Object.fromEntries(
          Object.entries(c.counts).filter(([periodId]) => periodId !== id)
        ),
      }))
    )
  }
  const setPeriodLabel = (id: string, label: string) =>
    setPeriods((prev) => prev.map((p) => (p.id === id ? { ...p, label } : p)))

  const addCategory = () =>
    setCategories((prev) => [
      ...prev,
      { id: nextCategoryId(), name: "", counts: {} },
    ])
  const removeCategory = (id: string) =>
    setCategories((prev) => prev.filter((c) => c.id !== id))
  const setCategoryName = (id: string, name: string) =>
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))
  const setCount = (categoryId: string, periodId: string, raw: string) =>
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, counts: { ...c.counts, [periodId]: raw } }
          : c
      )
    )

  const num = (raw: string | undefined) => {
    const n = Number(raw)
    return Number.isFinite(n) ? Math.max(n, 0) : 0
  }

  const rowTotals = categories.map((c) => ({
    id: c.id,
    total: periods.reduce((sum, p) => sum + num(c.counts[p.id]), 0),
  }))
  const colTotals = periods.map((p) => ({
    id: p.id,
    total: categories.reduce((sum, c) => sum + num(c.counts[p.id]), 0),
  }))
  const grandTotal = rowTotals.reduce((sum, r) => sum + r.total, 0)

  return {
    periods,
    categories,
    addPeriod,
    removePeriod,
    setPeriodLabel,
    addCategory,
    removeCategory,
    setCategoryName,
    setCount,
    rowTotals,
    colTotals,
    grandTotal,
  }
}

export function CheckSheetCard() {
  const cs = useCheckSheet()
  const [, update] = useSixSigmaProject()

  // The check sheet is where counts are collected; the Pareto chart is where
  // they get ranked. Sending the row totals across keeps them one data set.
  const sendToPareto = () =>
    update((p) => ({
      ...p,
      defectCategories: cs.categories
        .map((c, i) => ({
          id: newId("dc"),
          name: c.name.trim() || `Category ${i + 1}`,
          count: String(cs.rowTotals[i]?.total ?? 0),
        }))
        .filter((c) => Number(c.count) > 0),
    }))

  const peak = cs.colTotals.reduce<{ id: string; total: number } | null>(
    (max, c) => (max === null || c.total > max.total ? c : max),
    null
  )
  const peakLabel = cs.periods.find((p) => p.id === peak?.id)?.label ?? "—"

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid2x2CheckIcon className="size-4" />
          Check Sheet
        </CardTitle>
        <CardDescription>
          Tally defects by category across shifts or days as they are observed.
          Counting where and when a defect appears often reveals the pattern
          before any analysis does.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 overflow-x-auto">
        <table className="w-full min-w-160 border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Category</th>
              {cs.periods.map((p) => (
                <th key={p.id} className="py-2 pr-3 font-medium">
                  <div className="flex items-center gap-1">
                    <Input
                      aria-label="Period label"
                      value={p.label}
                      onChange={(e) => cs.setPeriodLabel(p.id, e.target.value)}
                      className="h-7 w-20 text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0"
                      onClick={() => cs.removePeriod(p.id)}
                    >
                      <XIcon className="size-3" />
                      <span className="sr-only">Remove period</span>
                    </Button>
                  </div>
                </th>
              ))}
              <th className="py-2 pr-3 font-medium">Total</th>
              <th className="py-2 font-medium">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={cs.addPeriod}
                >
                  <PlusIcon className="size-3" />
                  Period
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {cs.categories.map((c, ci) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-1.5 pr-3">
                  <Input
                    aria-label="Category name"
                    placeholder="Category"
                    value={c.name}
                    onChange={(e) => cs.setCategoryName(c.id, e.target.value)}
                    className="h-8 w-32 text-sm"
                  />
                </td>
                {cs.periods.map((p) => (
                  <td key={p.id} className="py-1.5 pr-3">
                    <Input
                      aria-label="Count"
                      inputMode="numeric"
                      value={c.counts[p.id] ?? ""}
                      onChange={(e) => cs.setCount(c.id, p.id, e.target.value)}
                      className="h-8 w-16 text-sm tabular-nums"
                    />
                  </td>
                ))}
                <td className="py-1.5 pr-3 font-medium tabular-nums">
                  {cs.rowTotals[ci]?.total ?? 0}
                </td>
                <td className="py-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => cs.removeCategory(c.id)}
                  >
                    <XIcon className="size-3" />
                    <span className="sr-only">Remove category</span>
                  </Button>
                </td>
              </tr>
            ))}
            <tr className="font-medium">
              <td className="py-2 pr-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={cs.addCategory}
                >
                  <PlusIcon className="size-3" />
                  Category
                </Button>
              </td>
              {cs.colTotals.map((ct) => (
                <td key={ct.id} className="py-2 pr-3 tabular-nums">
                  {ct.total}
                </td>
              ))}
              <td className="py-2 pr-3 tabular-nums">{cs.grandTotal}</td>
              <td />
            </tr>
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Result label="Total tallied" value={String(cs.grandTotal)} />
          <Result label="Categories" value={String(cs.categories.length)} />
          <Result label="Periods" value={String(cs.periods.length)} />
          <Result
            label="Worst period"
            value={peak && peak.total > 0 ? peakLabel : "—"}
            tone={peak && peak.total > 0 ? "bad" : "default"}
            hint={peak && peak.total > 0 ? `${peak.total} defects` : undefined}
          />
        </div>
        <SectionNote>
          Use the same categories and the same definition of a defect on every
          shift. If two people count differently, the sheet measures the
          counters rather than the process, which is what a Gage R&amp;R study
          checks.
        </SectionNote>
        <FlowFooter>
          <SendButton onClick={sendToPareto}>
            Send row totals to Pareto
          </SendButton>
          <ToolLink href="/qc-tools/pareto">Pareto chart</ToolLink>
          <ToolLink href="/six-sigma/gage-rr">Gage R&amp;R</ToolLink>
        </FlowFooter>
      </CardContent>
    </Card>
  )
}

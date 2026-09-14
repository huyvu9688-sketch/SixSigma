"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/** Local numeric input state: raw text plus a clamped (≥ 0) numeric value. */
export function useNumberField(initial: number) {
  const [raw, setRaw] = React.useState(String(initial))
  const value = React.useMemo(() => {
    const n = Number(raw)
    return Number.isFinite(n) ? Math.max(n, 0) : 0
  }, [raw])
  return { raw, setRaw, value }
}

/** Like useNumberField but allows negative values (spec limits, offsets). */
export function useSignedNumberField(initial: number) {
  const [raw, setRaw] = React.useState(String(initial))
  const value = React.useMemo(() => {
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  }, [raw])
  return { raw, setRaw, value }
}

export function Field({
  id,
  label,
  suffix,
  raw,
  setRaw,
  className,
  placeholder,
}: {
  id: string
  label: string
  suffix?: string
  raw: string
  setRaw: (v: string) => void
  className?: string
  placeholder?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          value={raw}
          placeholder={placeholder}
          onChange={(e) => setRaw(e.target.value)}
          style={
            suffix ? { paddingRight: `${suffix.length + 2}ch` } : undefined
          }
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function TextField({
  id,
  label,
  value,
  onChange,
  className,
  placeholder,
  multiline = false,
  rows = 3,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  className?: string
  placeholder?: string
  multiline?: boolean
  rows?: number
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

export type Tone = "default" | "good" | "warn" | "bad"

export function toneClass(tone: Tone) {
  return tone === "good"
    ? "text-green-600 dark:text-green-400"
    : tone === "warn"
      ? "text-yellow-600 dark:text-yellow-400"
      : tone === "bad"
        ? "text-destructive"
        : "text-foreground"
}

export function Result({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string
  value: string
  tone?: Tone
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn("text-xl font-semibold tabular-nums", toneClass(tone))}
      >
        {value}
      </span>
      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  )
}

/** Small footnote for the formula behind a card. */
export function SectionNote({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>
  )
}

/** A link to another tool, used to show where a result flows next. */
export function ToolLink({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("h-7 gap-1 text-xs", className)}
      render={<Link href={href} />}
    >
      {children}
      <ArrowRightIcon className="size-3" />
    </Button>
  )
}

/** An action button that pushes data into another tool. */
export function SendButton({
  onClick,
  children,
  className,
}: {
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className={cn("h-7 gap-1 text-xs", className)}
      onClick={onClick}
    >
      {children}
      <ArrowRightIcon className="size-3" />
    </Button>
  )
}

/** Format helpers shared by the tools. */
export const fmt = {
  pct: (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`,
  num: (n: number, digits = 0) =>
    n.toLocaleString(undefined, { maximumFractionDigits: digits }),
  money: (n: number) =>
    `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
  fixed: (n: number, digits = 2) =>
    Number.isFinite(n) ? n.toFixed(digits) : "—",
}

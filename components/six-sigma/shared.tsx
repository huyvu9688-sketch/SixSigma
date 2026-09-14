"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon, XIcon } from "lucide-react"
import { newId, type IdText } from "@/lib/six-sigma/project-store"

/**
 * A list of single-line text rows with add/remove, used for SIPOC lanes,
 * fishbone causes, 5 Whys, and team members. Rows are `{ id, text }` so React
 * keys stay stable while the text is edited.
 */
export function EditableTextList({
  items,
  onChange,
  label,
  addLabel = "Item",
  idPrefix,
  placeholder,
  numbered = false,
  minRows = 0,
  className,
}: {
  items: IdText[]
  onChange: (next: IdText[]) => void
  label?: string
  addLabel?: string
  idPrefix: string
  placeholder?: string
  numbered?: boolean
  minRows?: number
  className?: string
}) {
  const add = () => onChange([...items, { id: newId(idPrefix), text: "" }])
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id))
  const set = (id: string, text: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)))

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
      ) : null}
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-1.5">
          {numbered ? (
            <Label
              htmlFor={`${idPrefix}-${item.id}`}
              className="w-14 shrink-0 text-xs font-normal text-muted-foreground"
            >
              {addLabel} {i + 1}
            </Label>
          ) : null}
          <Input
            id={`${idPrefix}-${item.id}`}
            aria-label={`${addLabel} ${i + 1}`}
            value={item.text}
            placeholder={placeholder}
            onChange={(e) => set(item.id, e.target.value)}
            className="h-8 text-sm"
          />
          {items.length > minRows ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={() => remove(item.id)}
            >
              <XIcon className="size-3" />
              <span className="sr-only">Remove {addLabel}</span>
            </Button>
          ) : null}
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="h-7 w-fit gap-1 text-xs"
        onClick={add}
      >
        <PlusIcon className="size-3" />
        {addLabel}
      </Button>
    </div>
  )
}

/** A compact table cell input used by the FMEA and control plan grids. */
export function CellInput({
  value,
  onChange,
  label,
  className,
  inputMode,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  className?: string
  inputMode?: "numeric" | "decimal" | "text"
  placeholder?: string
}) {
  return (
    <Input
      aria-label={label}
      value={value}
      inputMode={inputMode}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-8 text-sm", className)}
    />
  )
}

/** Row of "what this feeds" links shown at the bottom of a tool card. */
export function FlowFooter({
  children,
  label = "Feeds into",
}: {
  children: React.ReactNode
  label?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

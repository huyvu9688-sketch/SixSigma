"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { DMAIC_PHASE_LABELS } from "@/lib/six-sigma/constants"
import {
  createProject,
  deleteProject,
  switchProject,
  updateProject,
  useProjectList,
} from "@/lib/six-sigma/project-store"
import {
  CheckIcon,
  ChevronsUpDownIcon,
  FolderKanbanIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

export function ProjectSwitcher() {
  const { isMobile } = useSidebar()
  const { projects, activeId } = useProjectList()
  const [creating, setCreating] = React.useState(false)
  const [name, setName] = React.useState("")
  const [renaming, setRenaming] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const active = projects.find((p) => p.id === activeId) ?? projects[0]

  function submit(e: React.FormEvent) {
    e.preventDefault()
    createProject(name)
    setName("")
    setCreating(false)
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault()
    const next = name.trim()
    if (next) updateProject((prev) => ({ ...prev, name: next }))
    setRenaming(false)
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="aria-expanded:bg-muted"
                />
              }
            >
              <FolderKanbanIcon className="size-5 shrink-0" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{active.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {DMAIC_PHASE_LABELS[active.phase]} phase
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-64"
              side={isMobile ? "bottom" : "right"}
              align="start"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Projects</DropdownMenuLabel>
                {projects.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => switchProject(p.id)}
                  >
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.id === activeId ? <CheckIcon /> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setName("")
                  setCreating(true)
                }}
              >
                <PlusIcon />
                New project
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setName(active.name)
                  setRenaming(true)
                }}
              >
                <PencilIcon />
                Rename current project
              </DropdownMenuItem>
              {projects.length > 1 ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleting(true)}
                >
                  <Trash2Icon />
                  Delete current project
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <form onSubmit={submit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>
                Starts empty at the Define phase. Your other projects are kept.
              </DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reduce dust nibs on Line 2"
              aria-label="Project name"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <form onSubmit={submitRename} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Project name"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenaming(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{active.name}”?</DialogTitle>
            <DialogDescription>
              All data entered in this project is removed from this browser.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(false)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteProject(activeId)
                setDeleting(false)
              }}
            >
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

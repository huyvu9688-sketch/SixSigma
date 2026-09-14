"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

export type NavItem = {
  title: string
  url: string
  icon?: React.ReactNode
  items?: { title: string; url: string }[]
}

export type NavSection = {
  label?: string
  items: NavItem[]
}

function isActive(pathname: string, url: string) {
  if (url === "#") return false
  return pathname === url
}

function CollapsibleNavItem({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const childActive = Boolean(
    item.items?.some((sub) => isActive(pathname, sub.url))
  )
  // The group holding the current page starts open, so a deep link lands with
  // its section already expanded. Tracking the previous value in state (not a
  // ref) lets the adjustment happen during render, with no expand flash and no
  // effect, while still leaving the user free to collapse it afterwards.
  const [open, setOpen] = React.useState(childActive)
  const [wasChildActive, setWasChildActive] = React.useState(childActive)
  if (childActive !== wasChildActive) {
    setWasChildActive(childActive)
    if (childActive) setOpen(true)
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} />}>
          {item.icon}
          <span>{item.title}</span>
          <ChevronRightIcon className="ml-auto transition-transform group-data-panel-open/collapsible:rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((sub) => (
              <SidebarMenuSubItem key={sub.title}>
                <SidebarMenuSubButton
                  isActive={isActive(pathname, sub.url)}
                  render={<Link href={sub.url} />}
                >
                  <span>{sub.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname()
  return (
    <>
      {sections.map((section, i) => (
        <SidebarGroup key={section.label ?? `section-${i}`}>
          {section.label ? (
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          ) : null}
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {section.items.map((item) =>
                item.items?.length ? (
                  <CollapsibleNavItem
                    key={item.title}
                    item={item}
                    pathname={pathname}
                  />
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive(pathname, item.url)}
                      render={
                        item.url === "#" ? <span /> : <Link href={item.url} />
                      }
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain, type NavSection } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  FactoryIcon,
  ShieldCheckIcon,
  ListChecksIcon,
  CalculatorIcon,
  PackageIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  ClipboardListIcon,
  ActivitySquareIcon,
  FileTextIcon,
  GaugeIcon,
  TargetIcon,
  RulerIcon,
  SearchCheckIcon,
  WrenchIcon,
  CirclePlusIcon,
  AlertTriangleIcon,
} from "lucide-react"

const user = {
  name: "J. Vu",
  email: "huyvu9688@gmail.com",
  avatar: "/avatars/shadcn.jpg",
}

// Navigation follows DMAIC so the sidebar reads as the order the work is done
// in, not as an alphabetical tool drawer.
const navSections: NavSection[] = [
  {
    items: [
      { title: "Dashboard", url: "/", icon: <LayoutDashboardIcon /> },
      { title: "DMAIC Project", url: "/six-sigma", icon: <TargetIcon /> },
    ],
  },
  {
    label: "Define",
    items: [
      {
        title: "Define",
        url: "#",
        icon: <ClipboardListIcon />,
        items: [
          { title: "Project Charter", url: "/six-sigma/charter" },
          { title: "SIPOC Diagram", url: "/six-sigma/sipoc" },
          { title: "CTQ Tree", url: "/six-sigma/ctq" },
          { title: "Cost of Quality", url: "/six-sigma/cost-of-quality" },
        ],
      },
    ],
  },
  {
    label: "Measure",
    items: [
      {
        title: "Measure",
        url: "#",
        icon: <RulerIcon />,
        items: [
          { title: "Sigma Level & DPMO", url: "/calculators/six-sigma" },
          { title: "Yield (FTY / RTY)", url: "/six-sigma/yield" },
          { title: "Process Capability", url: "/six-sigma/capability" },
          { title: "FMEA", url: "/six-sigma/fmea" },
          { title: "Gage R&R", url: "/six-sigma/gage-rr" },
          { title: "Sample Size", url: "/six-sigma/sample-size" },
          { title: "Check Sheet", url: "/qc-tools/check-sheet" },
        ],
      },
    ],
  },
  {
    label: "Analyze",
    items: [
      {
        title: "Analyze",
        url: "#",
        icon: <SearchCheckIcon />,
        items: [
          { title: "Pareto Analysis", url: "/qc-tools/pareto" },
          { title: "Histogram", url: "/qc-tools/histogram" },
          { title: "5 Whys & Fishbone", url: "/calculators/root-cause" },
          { title: "Cause & Effect Diagram", url: "/qc-tools/cause-effect" },
          { title: "Scatter Diagram", url: "/qc-tools/scatter" },
          { title: "Hypothesis Test", url: "/six-sigma/hypothesis-test" },
        ],
      },
    ],
  },
  {
    label: "Improve",
    items: [
      {
        title: "Improve",
        url: "#",
        icon: <WrenchIcon />,
        items: [
          { title: "Implementation Plan", url: "/qc-tools/gantt" },
          { title: "Value Stream Mapping", url: "/calculators/vsm" },
          { title: "Muda (8 Wastes)", url: "/calculators/muda" },
          { title: "Takt Time & Line Balance", url: "/calculators/balance" },
          { title: "OEE Calculator", url: "/calculators/oee" },
        ],
      },
    ],
  },
  {
    label: "Control",
    items: [
      {
        title: "Control",
        url: "#",
        icon: <ShieldCheckIcon />,
        items: [
          {
            title: "Control Chart (I-MR, X̄-R)",
            url: "/qc-tools/control-chart",
          },
          { title: "Attribute Charts", url: "/six-sigma/attribute-chart" },
          { title: "Control Plan", url: "/six-sigma/control-plan" },
        ],
      },
    ],
  },
  {
    label: "Shop floor",
    items: [
      { title: "Production Lines", url: "#", icon: <FactoryIcon /> },
      { title: "Quality (SPC)", url: "#", icon: <GaugeIcon /> },
      { title: "Inventory / WIP", url: "#", icon: <PackageIcon /> },
      { title: "Downtime Events", url: "#", icon: <ActivitySquareIcon /> },
      { title: "All 7QC Tools", url: "#", icon: <ListChecksIcon /> },
      { title: "Calculators", url: "#", icon: <CalculatorIcon /> },
    ],
  },
]

const navSecondary = [
  { title: "Settings", url: "#", icon: <Settings2Icon /> },
  { title: "Get Help", url: "#", icon: <CircleHelpIcon /> },
  { title: "Search", url: "#", icon: <SearchIcon /> },
]

const documents = [
  { name: "Shift Reports", url: "#", icon: <FileTextIcon /> },
  { name: "SPC Charts", url: "#", icon: <GaugeIcon /> },
  { name: "Work Instructions", url: "#", icon: <ClipboardListIcon /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/" />}
            >
              <Image
                src="/brand/wanek-logo.webp"
                alt="Wanek Furniture"
                width={20}
                height={20}
                className="size-5! shrink-0"
              />
              <span className="text-base font-semibold">Wanek Furniture</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center gap-2">
                <SidebarMenuButton
                  tooltip="New Work Order"
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                >
                  <CirclePlusIcon />
                  <span>New Work Order</span>
                </SidebarMenuButton>
                <Button
                  size="icon"
                  className="size-8 group-data-[collapsible=icon]:opacity-0"
                  variant="outline"
                >
                  <AlertTriangleIcon />
                  <span className="sr-only">Downtime Alerts</span>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavMain sections={navSections} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

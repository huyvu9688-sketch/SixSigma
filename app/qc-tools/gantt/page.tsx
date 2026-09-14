import { AppShell } from "@/components/app-shell"
import { GanttChartCard } from "@/components/gantt-chart"

export default function GanttChartPage() {
  return (
    <AppShell title="Gantt Chart">
      <div className="px-4 lg:px-6">
        <GanttChartCard />
      </div>
    </AppShell>
  )
}

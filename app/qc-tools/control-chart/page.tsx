import { AppShell } from "@/components/app-shell"
import { ControlChartTool } from "@/components/control-chart"

export default function ControlChartPage() {
  return (
    <AppShell title="Control Chart">
      <div className="px-4 lg:px-6">
        <ControlChartTool />
      </div>
    </AppShell>
  )
}

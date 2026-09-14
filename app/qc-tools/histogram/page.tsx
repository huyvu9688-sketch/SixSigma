import { AppShell } from "@/components/app-shell"
import { HistogramTool } from "@/components/histogram-chart"

export default function HistogramPage() {
  return (
    <AppShell title="Histogram">
      <div className="px-4 lg:px-6">
        <HistogramTool />
      </div>
    </AppShell>
  )
}

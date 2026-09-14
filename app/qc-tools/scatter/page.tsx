import { AppShell } from "@/components/app-shell"
import { ScatterDiagramTool } from "@/components/scatter-diagram"

export default function ScatterDiagramPage() {
  return (
    <AppShell title="Scatter Diagram">
      <div className="px-4 lg:px-6">
        <ScatterDiagramTool />
      </div>
    </AppShell>
  )
}

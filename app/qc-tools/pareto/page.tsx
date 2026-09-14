import { AppShell } from "@/components/app-shell"
import { ParetoAnalysisCard } from "@/components/pareto-chart"

export default function ParetoAnalysisPage() {
  return (
    <AppShell title="Pareto Analysis">
      <div className="px-4 lg:px-6">
        <ParetoAnalysisCard />
      </div>
    </AppShell>
  )
}

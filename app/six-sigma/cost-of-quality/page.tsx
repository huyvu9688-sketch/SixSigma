import { AppShell } from "@/components/app-shell"
import { CostOfQualityTool } from "@/components/six-sigma/cost-of-quality"

export default function CostOfQualityPage() {
  return (
    <AppShell title="Cost of Quality">
      <div className="px-4 lg:px-6">
        <CostOfQualityTool />
      </div>
    </AppShell>
  )
}

import { AppShell } from "@/components/app-shell"
import { RootCauseAnalysisCard } from "@/components/root-cause-analysis"

export default function RootCauseAnalysisPage() {
  return (
    <AppShell title="Root Cause Analysis">
      <div className="px-4 lg:px-6">
        <RootCauseAnalysisCard />
      </div>
    </AppShell>
  )
}

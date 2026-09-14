import { AppShell } from "@/components/app-shell"
import { CauseEffectCard } from "@/components/root-cause-analysis"

export default function CauseEffectPage() {
  return (
    <AppShell title="Cause & Effect (Fishbone) Diagram">
      <div className="px-4 lg:px-6">
        <CauseEffectCard />
      </div>
    </AppShell>
  )
}

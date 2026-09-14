import { AppShell } from "@/components/app-shell"
import { SixSigmaHub } from "@/components/six-sigma/hub"

export default function SixSigmaHubPage() {
  return (
    <AppShell title="DMAIC Project">
      <div className="px-4 lg:px-6">
        <SixSigmaHub />
      </div>
    </AppShell>
  )
}

import { AppShell } from "@/components/app-shell"
import { SigmaLevelTool } from "@/components/six-sigma/sigma-level"

export default function SigmaLevelPage() {
  return (
    <AppShell title="Sigma Level & DPMO">
      <div className="px-4 lg:px-6">
        <SigmaLevelTool />
      </div>
    </AppShell>
  )
}

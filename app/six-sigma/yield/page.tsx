import { AppShell } from "@/components/app-shell"
import { YieldTool } from "@/components/six-sigma/yield-tool"

export default function YieldPage() {
  return (
    <AppShell title="Yield — FTY & RTY">
      <div className="px-4 lg:px-6">
        <YieldTool />
      </div>
    </AppShell>
  )
}

import { AppShell } from "@/components/app-shell"
import { GageRrTool } from "@/components/six-sigma/gage-rr"

export default function GageRrPage() {
  return (
    <AppShell title="Gage R&R">
      <div className="px-4 lg:px-6">
        <GageRrTool />
      </div>
    </AppShell>
  )
}

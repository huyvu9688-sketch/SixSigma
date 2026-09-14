import { AppShell } from "@/components/app-shell"
import { CapabilityTool } from "@/components/six-sigma/capability"

export default function CapabilityPage() {
  return (
    <AppShell title="Process Capability">
      <div className="px-4 lg:px-6">
        <CapabilityTool />
      </div>
    </AppShell>
  )
}

import { AppShell } from "@/components/app-shell"
import { ControlPlanTool } from "@/components/six-sigma/control-plan"

export default function ControlPlanPage() {
  return (
    <AppShell title="Control Plan">
      <div className="px-4 lg:px-6">
        <ControlPlanTool />
      </div>
    </AppShell>
  )
}

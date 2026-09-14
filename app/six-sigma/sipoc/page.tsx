import { AppShell } from "@/components/app-shell"
import { SipocTool } from "@/components/six-sigma/sipoc"

export default function SipocPage() {
  return (
    <AppShell title="SIPOC Diagram">
      <div className="px-4 lg:px-6">
        <SipocTool />
      </div>
    </AppShell>
  )
}

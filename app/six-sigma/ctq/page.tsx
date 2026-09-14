import { AppShell } from "@/components/app-shell"
import { CtqTreeTool } from "@/components/six-sigma/ctq-tree"

export default function CtqTreePage() {
  return (
    <AppShell title="CTQ Tree">
      <div className="px-4 lg:px-6">
        <CtqTreeTool />
      </div>
    </AppShell>
  )
}

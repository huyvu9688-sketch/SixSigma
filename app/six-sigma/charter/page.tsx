import { AppShell } from "@/components/app-shell"
import { CharterTool } from "@/components/six-sigma/charter"

export default function CharterPage() {
  return (
    <AppShell title="Project Charter">
      <div className="px-4 lg:px-6">
        <CharterTool />
      </div>
    </AppShell>
  )
}

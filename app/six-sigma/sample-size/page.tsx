import { AppShell } from "@/components/app-shell"
import { SampleSizeTool } from "@/components/six-sigma/sample-size"

export default function SampleSizePage() {
  return (
    <AppShell title="Sample Size">
      <div className="px-4 lg:px-6">
        <SampleSizeTool />
      </div>
    </AppShell>
  )
}

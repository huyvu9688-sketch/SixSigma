import { AppShell } from "@/components/app-shell"
import { HypothesisTestTool } from "@/components/six-sigma/hypothesis-test"

export default function HypothesisTestPage() {
  return (
    <AppShell title="Hypothesis Test">
      <div className="px-4 lg:px-6">
        <HypothesisTestTool />
      </div>
    </AppShell>
  )
}

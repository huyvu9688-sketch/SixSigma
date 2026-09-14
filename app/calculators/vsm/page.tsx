import { AppShell } from "@/components/app-shell"
import { ValueStreamMapCard } from "@/components/value-stream-map"

export default function ValueStreamMapPage() {
  return (
    <AppShell title="Value Stream Mapping">
      <div className="px-4 lg:px-6">
        <ValueStreamMapCard />
      </div>
    </AppShell>
  )
}

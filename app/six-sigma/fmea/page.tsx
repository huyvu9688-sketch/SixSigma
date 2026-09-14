import { AppShell } from "@/components/app-shell"
import { FmeaTool } from "@/components/six-sigma/fmea"

export default function FmeaPage() {
  return (
    <AppShell title="FMEA">
      <div className="px-4 lg:px-6">
        <FmeaTool />
      </div>
    </AppShell>
  )
}

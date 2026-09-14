import { AppShell } from "@/components/app-shell"
import { OeeCalculatorCard } from "@/components/production-calculators"

export default function OeeCalculatorPage() {
  return (
    <AppShell title="OEE Calculator">
      <div className="px-4 lg:px-6">
        <OeeCalculatorCard />
      </div>
    </AppShell>
  )
}

import { AppShell } from "@/components/app-shell"
import { TaktLineBalanceCalculatorCard } from "@/components/production-calculators"

export default function TaktLineBalanceCalculatorPage() {
  return (
    <AppShell title="Takt Time & Line Balance">
      <div className="px-4 lg:px-6">
        <TaktLineBalanceCalculatorCard />
      </div>
    </AppShell>
  )
}

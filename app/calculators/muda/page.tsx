import { AppShell } from "@/components/app-shell"
import { MudaCalculatorCard } from "@/components/muda-calculator"

export default function MudaCalculatorPage() {
  return (
    <AppShell title="Muda (Waste) Calculator">
      <div className="px-4 lg:px-6">
        <MudaCalculatorCard />
      </div>
    </AppShell>
  )
}

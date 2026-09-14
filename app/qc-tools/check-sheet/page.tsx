import { AppShell } from "@/components/app-shell"
import { CheckSheetCard } from "@/components/check-sheet"

export default function CheckSheetPage() {
  return (
    <AppShell title="Check Sheet">
      <div className="px-4 lg:px-6">
        <CheckSheetCard />
      </div>
    </AppShell>
  )
}

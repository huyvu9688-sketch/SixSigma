import { AppShell } from "@/components/app-shell"
import { AttributeChartTool } from "@/components/six-sigma/attribute-chart"

export default function AttributeChartPage() {
  return (
    <AppShell title="Attribute Control Charts">
      <div className="px-4 lg:px-6">
        <AttributeChartTool />
      </div>
    </AppShell>
  )
}

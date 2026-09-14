"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export const description = "Daily production output vs. scrap"

const chartData = [
  { date: "2024-04-01", good: 222, scrap: 150 },
  { date: "2024-04-02", good: 97, scrap: 180 },
  { date: "2024-04-03", good: 167, scrap: 120 },
  { date: "2024-04-04", good: 242, scrap: 260 },
  { date: "2024-04-05", good: 373, scrap: 290 },
  { date: "2024-04-06", good: 301, scrap: 340 },
  { date: "2024-04-07", good: 245, scrap: 180 },
  { date: "2024-04-08", good: 409, scrap: 320 },
  { date: "2024-04-09", good: 59, scrap: 110 },
  { date: "2024-04-10", good: 261, scrap: 190 },
  { date: "2024-04-11", good: 327, scrap: 350 },
  { date: "2024-04-12", good: 292, scrap: 210 },
  { date: "2024-04-13", good: 342, scrap: 380 },
  { date: "2024-04-14", good: 137, scrap: 220 },
  { date: "2024-04-15", good: 120, scrap: 170 },
  { date: "2024-04-16", good: 138, scrap: 190 },
  { date: "2024-04-17", good: 446, scrap: 360 },
  { date: "2024-04-18", good: 364, scrap: 410 },
  { date: "2024-04-19", good: 243, scrap: 180 },
  { date: "2024-04-20", good: 89, scrap: 150 },
  { date: "2024-04-21", good: 137, scrap: 200 },
  { date: "2024-04-22", good: 224, scrap: 170 },
  { date: "2024-04-23", good: 138, scrap: 230 },
  { date: "2024-04-24", good: 387, scrap: 290 },
  { date: "2024-04-25", good: 215, scrap: 250 },
  { date: "2024-04-26", good: 75, scrap: 130 },
  { date: "2024-04-27", good: 383, scrap: 420 },
  { date: "2024-04-28", good: 122, scrap: 180 },
  { date: "2024-04-29", good: 315, scrap: 240 },
  { date: "2024-04-30", good: 454, scrap: 380 },
  { date: "2024-05-01", good: 165, scrap: 220 },
  { date: "2024-05-02", good: 293, scrap: 310 },
  { date: "2024-05-03", good: 247, scrap: 190 },
  { date: "2024-05-04", good: 385, scrap: 420 },
  { date: "2024-05-05", good: 481, scrap: 390 },
  { date: "2024-05-06", good: 498, scrap: 520 },
  { date: "2024-05-07", good: 388, scrap: 300 },
  { date: "2024-05-08", good: 149, scrap: 210 },
  { date: "2024-05-09", good: 227, scrap: 180 },
  { date: "2024-05-10", good: 293, scrap: 330 },
  { date: "2024-05-11", good: 335, scrap: 270 },
  { date: "2024-05-12", good: 197, scrap: 240 },
  { date: "2024-05-13", good: 197, scrap: 160 },
  { date: "2024-05-14", good: 448, scrap: 490 },
  { date: "2024-05-15", good: 473, scrap: 380 },
  { date: "2024-05-16", good: 338, scrap: 400 },
  { date: "2024-05-17", good: 499, scrap: 420 },
  { date: "2024-05-18", good: 315, scrap: 350 },
  { date: "2024-05-19", good: 235, scrap: 180 },
  { date: "2024-05-20", good: 177, scrap: 230 },
  { date: "2024-05-21", good: 82, scrap: 140 },
  { date: "2024-05-22", good: 81, scrap: 120 },
  { date: "2024-05-23", good: 252, scrap: 290 },
  { date: "2024-05-24", good: 294, scrap: 220 },
  { date: "2024-05-25", good: 201, scrap: 250 },
  { date: "2024-05-26", good: 213, scrap: 170 },
  { date: "2024-05-27", good: 420, scrap: 460 },
  { date: "2024-05-28", good: 233, scrap: 190 },
  { date: "2024-05-29", good: 78, scrap: 130 },
  { date: "2024-05-30", good: 340, scrap: 280 },
  { date: "2024-05-31", good: 178, scrap: 230 },
  { date: "2024-06-01", good: 178, scrap: 200 },
  { date: "2024-06-02", good: 470, scrap: 410 },
  { date: "2024-06-03", good: 103, scrap: 160 },
  { date: "2024-06-04", good: 439, scrap: 380 },
  { date: "2024-06-05", good: 88, scrap: 140 },
  { date: "2024-06-06", good: 294, scrap: 250 },
  { date: "2024-06-07", good: 323, scrap: 370 },
  { date: "2024-06-08", good: 385, scrap: 320 },
  { date: "2024-06-09", good: 438, scrap: 480 },
  { date: "2024-06-10", good: 155, scrap: 200 },
  { date: "2024-06-11", good: 92, scrap: 150 },
  { date: "2024-06-12", good: 492, scrap: 420 },
  { date: "2024-06-13", good: 81, scrap: 130 },
  { date: "2024-06-14", good: 426, scrap: 380 },
  { date: "2024-06-15", good: 307, scrap: 350 },
  { date: "2024-06-16", good: 371, scrap: 310 },
  { date: "2024-06-17", good: 475, scrap: 520 },
  { date: "2024-06-18", good: 107, scrap: 170 },
  { date: "2024-06-19", good: 341, scrap: 290 },
  { date: "2024-06-20", good: 408, scrap: 450 },
  { date: "2024-06-21", good: 169, scrap: 210 },
  { date: "2024-06-22", good: 317, scrap: 270 },
  { date: "2024-06-23", good: 480, scrap: 530 },
  { date: "2024-06-24", good: 132, scrap: 180 },
  { date: "2024-06-25", good: 141, scrap: 190 },
  { date: "2024-06-26", good: 434, scrap: 380 },
  { date: "2024-06-27", good: 448, scrap: 490 },
  { date: "2024-06-28", good: 149, scrap: 200 },
  { date: "2024-06-29", good: 103, scrap: 160 },
  { date: "2024-06-30", good: 446, scrap: 400 },
]

const chartConfig = {
  units: {
    label: "Units",
  },
  good: {
    label: "Good Units",
    color: "var(--primary)",
  },
  scrap: {
    label: "Scrap Units",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  // The range defaults to a narrower window on phones, but an explicit pick
  // always wins. Deriving it from `isMobile` avoids a setState-in-effect that
  // would clobber the user's choice on every resize.
  const [picked, setTimeRange] = React.useState<string | null>(null)
  const timeRange = picked ?? (isMobile ? "7d" : "90d")

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Production Output</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Good vs. scrap units for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "90d")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value)
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillGood" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-good)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-good)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillScrap" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-scrap)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-scrap)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="scrap"
              type="natural"
              fill="url(#fillScrap)"
              stroke="var(--color-scrap)"
              stackId="a"
            />
            <Area
              dataKey="good"
              type="natural"
              fill="url(#fillGood)"
              stroke="var(--color-good)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

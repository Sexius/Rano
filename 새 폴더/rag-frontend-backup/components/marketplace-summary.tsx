import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Store, Package, MapPin, DollarSign } from "lucide-react"

const stats = [
  {
    label: "Total Vendors",
    value: "1,247",
    change: "+8.3%",
    trend: "up",
    icon: Store,
  },
  {
    label: "Total Items Listed",
    value: "12,847",
    change: "+12.5%",
    trend: "up",
    icon: Package,
  },
  {
    label: "Most Active Map",
    value: "Prontera",
    change: "342 vendors",
    trend: "up",
    icon: MapPin,
  },
  {
    label: "Average Price Trend",
    value: "2.4M",
    change: "-3.1%",
    trend: "down",
    icon: DollarSign,
  },
]

export function MarketplaceSummary() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown

        return (
          <Card key={stat.label} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-balance">{stat.value}</p>
                <div className="flex items-center gap-1">
                  <TrendIcon className={`h-3 w-3 ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`} />
                  <span className={`text-xs font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-secondary p-2.5">
                <Icon className="h-5 w-5 text-secondary-foreground" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

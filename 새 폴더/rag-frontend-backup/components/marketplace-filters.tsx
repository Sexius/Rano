"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SlidersHorizontal, X } from "lucide-react"

export function MarketplaceFilters() {
  return (
    <Card className="p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Map" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Maps</SelectItem>
              <SelectItem value="prontera">Prontera</SelectItem>
              <SelectItem value="geffen">Geffen</SelectItem>
              <SelectItem value="payon">Payon</SelectItem>
              <SelectItem value="alberta">Alberta</SelectItem>
              <SelectItem value="izlude">Izlude</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Item Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="weapons">Weapons</SelectItem>
              <SelectItem value="armor">Armor</SelectItem>
              <SelectItem value="cards">Cards</SelectItem>
              <SelectItem value="consumables">Consumables</SelectItem>
              <SelectItem value="materials">Materials</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Server" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Servers</SelectItem>
              <SelectItem value="chaos">Chaos</SelectItem>
              <SelectItem value="loki">Loki</SelectItem>
              <SelectItem value="iris">Iris</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Slot Count" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Slots</SelectItem>
              <SelectItem value="0">No Slots</SelectItem>
              <SelectItem value="1">[1] Slot</SelectItem>
              <SelectItem value="2">[2] Slots</SelectItem>
              <SelectItem value="3">[3] Slots</SelectItem>
              <SelectItem value="4">[4] Slots</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="0-100k">0 - 100k</SelectItem>
              <SelectItem value="100k-1m">100k - 1M</SelectItem>
              <SelectItem value="1m-10m">1M - 10M</SelectItem>
              <SelectItem value="10m+">10M+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="lg:w-auto bg-transparent">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <Badge variant="secondary" className="gap-1">
          Prontera
          <X className="h-3 w-3 cursor-pointer" />
        </Badge>
        <Badge variant="secondary" className="gap-1">
          Weapons
          <X className="h-3 w-3 cursor-pointer" />
        </Badge>
      </div>
    </Card>
  )
}

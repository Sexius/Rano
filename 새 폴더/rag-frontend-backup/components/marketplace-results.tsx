import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, MapPin, Store } from "lucide-react"

const vendors = [
  {
    id: 1,
    vendorName: "KnightMaster",
    mapName: "Prontera",
    coordinates: "156, 187",
    itemName: "Excalibur [2]",
    itemImage: "/legendary-sword.png",
    price: "15,000,000",
    category: "Weapon",
    rarity: "Legendary",
  },
  {
    id: 2,
    vendorName: "ArmorDealer",
    mapName: "Geffen",
    coordinates: "120, 138",
    itemName: "Valkyrie Armor",
    itemImage: "/fantasy-armor.png",
    price: "8,500,000",
    category: "Armor",
    rarity: "Epic",
  },
  {
    id: 3,
    vendorName: "CardCollector",
    mapName: "Prontera",
    coordinates: "145, 203",
    itemName: "Ghostring Card",
    itemImage: "/mystical-card.png",
    price: "12,000,000",
    category: "Card",
    rarity: "Rare",
  },
  {
    id: 4,
    vendorName: "PotionShop",
    mapName: "Alberta",
    coordinates: "98, 65",
    itemName: "Yggdrasil Berry",
    itemImage: "/healing-berry.jpg",
    price: "50,000",
    category: "Consumable",
    rarity: "Uncommon",
  },
  {
    id: 5,
    vendorName: "WeaponMaster",
    mapName: "Payon",
    coordinates: "175, 142",
    itemName: "Mjolnir [1]",
    itemImage: "/thunder-hammer.jpg",
    price: "22,000,000",
    category: "Weapon",
    rarity: "Legendary",
  },
  {
    id: 6,
    vendorName: "RareCards",
    mapName: "Prontera",
    coordinates: "162, 195",
    itemName: "Angeling Card",
    itemImage: "/angel-card.jpg",
    price: "9,800,000",
    category: "Card",
    rarity: "Epic",
  },
]

const rarityColors = {
  Common: "bg-gray-100 text-gray-800 border-gray-300",
  Uncommon: "bg-green-100 text-green-800 border-green-300",
  Rare: "bg-blue-100 text-blue-800 border-blue-300",
  Epic: "bg-purple-100 text-purple-800 border-purple-300",
  Legendary: "bg-orange-100 text-orange-800 border-orange-300",
}

export function MarketplaceResults() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-balance">Active Vending Booths</h2>
        <p className="text-sm text-muted-foreground">Showing {vendors.length} vendors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="p-4 pb-3 bg-secondary/30 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{vendor.vendorName}</span>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative aspect-square overflow-hidden bg-secondary">
              <img
                src={vendor.itemImage || "/placeholder.svg"}
                alt={vendor.itemName}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{vendor.mapName}</span>
                <span className="text-xs">({vendor.coordinates})</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-balance leading-tight">{vendor.itemName}</h3>
                  <Badge variant="outline" className={rarityColors[vendor.rarity as keyof typeof rarityColors]}>
                    {vendor.rarity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{vendor.category}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-lg font-bold text-balance">{vendor.price}z</p>
                </div>
                <Button size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Visit Vendor
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" size="lg">
          Load More Vendors
        </Button>
      </div>
    </div>
  )
}

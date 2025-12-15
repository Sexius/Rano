"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface Item {
  id: number
  name: string
  description?: string
  atk?: number
  weight?: number
}

interface ItemDetail extends Item {
  defense?: number
  requiredLevel?: number
  job?: number
  slots?: number
  limitLevel?: number
  itemLevel?: number
  location?: string
  classNum?: number
}

export default function ItemsPage() {
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const searchItems = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`http://localhost:8080/api/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('검색에 실패했습니다.')
      }
      const data = await response.json()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const fetchItemDetail = async (id: number) => {
    setDetailLoading(true)
    setIsSheetOpen(true)
    try {
      const response = await fetch(`http://localhost:8080/api/item/${id}`)
      if (!response.ok) {
        throw new Error('상세 정보를 가져오는데 실패했습니다.')
      }
      const data = await response.json()
      setSelectedItem(data)
    } catch (err) {
      console.error(err)
      // 에러 처리 (필요하다면 토스트 메시지 등)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchItems()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">아이템 정보 검색</h1>
              <p className="text-muted-foreground">
                라그나로크 온라인의 아이템 정보를 검색해보세요.
              </p>
            </div>

            <div className="search-box">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="아이템 이름을 입력하세요 (예: sword)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                  />
                </div>
                <Button onClick={searchItems} disabled={loading || !query.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      검색 중...
                    </>
                  ) : (
                    "검색"
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {items.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">검색 결과 ({items.length}개)</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => fetchItemDetail(item.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://static.divine-pride.net/images/items/collection/${item.id}.png`}
                            alt={item.name}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <div>
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <CardDescription>ID: {item.id}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {item.atk && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">공격력:</span>
                              <Badge variant="secondary">{item.atk}</Badge>
                            </div>
                          )}
                          {item.weight && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">무게:</span>
                              <span className="text-sm">{item.weight}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>아이템 상세 정보</SheetTitle>
            <SheetDescription>
              선택한 아이템의 상세 정보를 확인하세요.
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedItem ? (
            <div className="mt-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <img
                  src={`https://static.divine-pride.net/images/items/collection/${selectedItem.id}.png`}
                  alt={selectedItem.name}
                  className="w-24 h-24 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="text-center">
                  <h3 className="text-xl font-bold">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {selectedItem.id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">설명</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedItem.description || "설명이 없습니다."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedItem.atk !== undefined && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">공격력</span>
                      <p className="font-medium">{selectedItem.atk}</p>
                    </div>
                  )}
                  {selectedItem.defense !== undefined && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">방어력</span>
                      <p className="font-medium">{selectedItem.defense}</p>
                    </div>
                  )}
                  {selectedItem.weight !== undefined && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">무게</span>
                      <p className="font-medium">{selectedItem.weight}</p>
                    </div>
                  )}
                  {selectedItem.slots !== undefined && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">슬롯</span>
                      <p className="font-medium">{selectedItem.slots}</p>
                    </div>
                  )}
                  {selectedItem.requiredLevel !== undefined && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">요구 레벨</span>
                      <p className="font-medium">{selectedItem.requiredLevel}</p>
                    </div>
                  )}
                  {selectedItem.limitLevel !== undefined && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">제한 레벨</span>
                      <p className="font-medium">{selectedItem.limitLevel}</p>
                    </div>
                  )}
                  {selectedItem.itemLevel !== undefined && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">아이템 레벨</span>
                      <p className="font-medium">{selectedItem.itemLevel}</p>
                    </div>
                  )}
                  {selectedItem.location !== undefined && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">장착 위치</span>
                      <p className="font-medium">{selectedItem.location}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 text-muted-foreground">
              아이템 정보를 불러올 수 없습니다.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}



"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Store, MapPin, ExternalLink, Loader2, Search } from "lucide-react"

interface VendingData {
  id: number
  vendor_name: string
  server_name: string
  coordinates: string
  item_name: string
  price: number
  category: string
  rarity: string
}

interface PaginationInfo {
  total: number
  page: number
  size: number
  total_pages: number
}

interface VendingResponse {
  data: VendingData[]
  pagination: PaginationInfo
}

export default function VendingPage() {
  const [vendingData, setVendingData] = useState<VendingData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedServer, setSelectedServer] = useState("baphomet")
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState("")

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const servers = [
    { value: "baphomet", label: "바포메트 서버" },
    { value: "ifrit", label: "이프리트 서버" }
  ]

  const fetchVendingData = async (serverName: string, page: number = 1, itemName?: string, forceRefresh: boolean = false) => {
    setLoading(true)
    setError("")

    // 검색어가 없으면 데이터를 가져오지 않음 (최근 데이터 표시 기능 제거)
    if (!itemName || !itemName.trim()) {
      setVendingData([])
      setTotalCount(0)
      setTotalPages(0)
      setLoading(false)
      return
    }

    try {
      let url = `http://localhost:8080/api/vending?server=${serverName}&page=${page}&size=${pageSize}`
      if (itemName && itemName.trim()) {
        url += `&item=${encodeURIComponent(itemName.trim())}`
        // 강제 새로고침 요청 시 refresh=true 파라미터 추가
        if (forceRefresh) {
          url += "&refresh=true"
        }
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('노점 데이터를 가져오는는데 실패했습니다.')
      }
      const result = await response.json()

      // 디버깅: 응답 구조 확인
      console.log('API 응답:', result)
      console.log('result.data:', result.data)
      console.log('result.pagination:', result.pagination)

      // 데이터 및 페이지네이션 정보 업데이트
      if (result.data && result.pagination) {
        setVendingData(result.data)
        setTotalCount(result.pagination.total)
        setTotalPages(result.pagination.total_pages)
        setCurrentPage(result.pagination.page)
      } else {
        throw new Error('잘못된 응답 형식입니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '노점 데이터를 가져오는 중 오류가 발생했습니다.')
      setVendingData([])
      setTotalCount(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendingData(selectedServer, 1)
  }, [selectedServer])

  const handleServerChange = (serverName: string) => {
    setSelectedServer(serverName)
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    // 검색 버튼 클릭 시에는 캐시된 데이터 우선 (빠른 응답)
    fetchVendingData(selectedServer, 1, searchQuery, false)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchVendingData(selectedServer, page, searchQuery)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'uncommon': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">노점 검색</h1>
              <p className="text-muted-foreground">
                라그나로크 온라인 서버별 노점 정보를 실시간으로 조회합니다.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>서버 선택</CardTitle>
                <CardDescription>
                  조회할 서버를 선택하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-center">
                  <Select value={selectedServer} onValueChange={handleServerChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="서버를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {servers.map((server) => (
                        <SelectItem key={server.value} value={server.value}>
                          {server.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => fetchVendingData(selectedServer, currentPage, searchQuery, true)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        조회 중...
                      </>
                    ) : (
                      "새로고침"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>아이템 검색</CardTitle>
                <CardDescription>
                  특정 아이템을 검색해보세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="아이템명 입력 (예: 젤로피, 클로버)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                  >
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
              </CardContent>
            </Card>

            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {vendingData.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {servers.find(s => s.value === selectedServer)?.label} 노점 (총 {totalCount}개)
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentPage} / {totalPages} 페이지
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vendingData.map((vendor) => (
                    <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{vendor.vendor_name}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{vendor.server_name}</span>
                            <span className="text-xs">({vendor.coordinates})</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-balance leading-tight">{vendor.item_name}</h3>
                              <Badge variant="outline" className={getRarityColor(vendor.rarity)}>
                                {vendor.rarity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{vendor.category}</p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Price</p>
                              <p className="text-lg font-bold text-balance">{vendor.price.toLocaleString()}z</p>
                            </div>
                            <Button size="sm" className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Visit Vendor
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    className="mt-8"
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

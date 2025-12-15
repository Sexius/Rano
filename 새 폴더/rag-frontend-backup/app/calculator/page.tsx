"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Calculator, Loader2 } from "lucide-react"

export default function CalculatorPage() {
  const [formData, setFormData] = useState({
    base_level: 99,
    str: 120,
    dex: 50,
    luk: 30,
    weapon_atk: 150,
    equip_atk: 25,
    monster_def: 50,
    skill_percent: 100
  })
  const [result, setResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }))
  }

  const calculateDamage = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch('http://localhost:8080/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('계산에 실패했습니다.')
      }

      const data = await response.json()
      setResult(data.final_damage)
    } catch (err) {
      setError(err instanceof Error ? err.message : '계산 중 오류가 발생했습니다.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">데미지 계산기</h1>
              <p className="text-muted-foreground">
                캐릭터의 스탯, 장비, 타겟 몬스터 정보를 입력하여 예상 데미지를 계산합니다.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* 캐릭터 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>캐릭터 정보</CardTitle>
                  <CardDescription>캐릭터의 기본 스탯과 장비 정보를 입력하세요.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="base-level">베이스 레벨</Label>
                      <Input
                        id="base-level"
                        type="number"
                        value={formData.base_level}
                        onChange={(e) => handleInputChange('base_level', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="str">STR (순수+보너스)</Label>
                      <Input
                        id="str"
                        type="number"
                        value={formData.str}
                        onChange={(e) => handleInputChange('str', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dex">DEX (순수+보너스)</Label>
                      <Input
                        id="dex"
                        type="number"
                        value={formData.dex}
                        onChange={(e) => handleInputChange('dex', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="luk">LUK (순수+보너스)</Label>
                      <Input
                        id="luk"
                        type="number"
                        value={formData.luk}
                        onChange={(e) => handleInputChange('luk', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weapon-atk">무기 ATK (+제련)</Label>
                      <Input
                        id="weapon-atk"
                        type="number"
                        value={formData.weapon_atk}
                        onChange={(e) => handleInputChange('weapon_atk', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="equip-atk">장비/카드 ATK</Label>
                      <Input
                        id="equip-atk"
                        type="number"
                        value={formData.equip_atk}
                        onChange={(e) => handleInputChange('equip_atk', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 타겟 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>타겟 정보</CardTitle>
                  <CardDescription>공격할 몬스터의 정보를 입력하세요.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monster-def">몬스터 방어력(DEF)</Label>
                      <Input
                        id="monster-def"
                        type="number"
                        value={formData.monster_def}
                        onChange={(e) => handleInputChange('monster_def', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="skill-percent">스킬 배율 (%)</Label>
                      <Input
                        id="skill-percent"
                        type="number"
                        value={formData.skill_percent}
                        onChange={(e) => handleInputChange('skill_percent', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 계산 버튼 */}
            <div className="flex justify-center">
              <Button
                onClick={calculateDamage}
                disabled={loading}
                size="lg"
                className="min-w-[200px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    계산 중...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    계산하기
                  </>
                )}
              </Button>
            </div>

            {/* 결과 표시 */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {result !== null && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-center">예상 데미지</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {result.toLocaleString()}
                    </div>
                    <p className="text-muted-foreground">데미지</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}



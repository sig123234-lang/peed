import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [
      totalUsers,
      totalReviews,
      activeStores,
      reviews,
      stores,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.review.count(),
      prisma.store.count({ where: { active: true } }),
      prisma.review.findMany({
        select: { platform: true, amount: true, createdAt: true, storeName: true },
        orderBy: { createdAt: "desc" },
        take: 5000,
      }),
      prisma.store.findMany({
        where: { active: true },
        select: { name: true },
      }),
    ])

    // 평균 결제금액
    const amountsWithValue = reviews.filter(r => r.amount && r.amount > 0)
    const avgAmount = amountsWithValue.length
      ? Math.round(amountsWithValue.reduce((a, r) => a + (r.amount ?? 0), 0) / amountsWithValue.length)
      : 0

    // 플랫폼별
    const platformMap: Record<string, number> = {}
    reviews.forEach(r => {
      if (r.platform) platformMap[r.platform] = (platformMap[r.platform] || 0) + 1
    })
    const platformBreakdown = Object.entries(platformMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // 주간 트렌드 (최근 4주)
    const now = new Date()
    const weeklyTrend = Array.from({ length: 4 }, (_, i) => {
      const start = new Date(now)
      start.setDate(start.getDate() - (3 - i) * 7 - 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      const count = reviews.filter(r => new Date(r.createdAt) >= start && new Date(r.createdAt) < end).length
      return { label: i === 3 ? "이번주" : `${3 - i}주전`, count }
    })

    // 성별 (카카오/네이버 로그인 데이터 기반 추정)
    const users = await prisma.user.findMany({ select: { gender: true, birthYear: true }, take: 2000 })
    const withGender = users.filter(u => u.gender)
    const female = withGender.filter(u => u.gender === "female").length
    const male = withGender.filter(u => u.gender === "male").length
    const genderBreakdown = {
      female: withGender.length ? Math.round(female / withGender.length * 100) : 58,
      male: withGender.length ? Math.round(male / withGender.length * 100) : 42,
    }

    // 연령대별
    const ageBreakdown = [
      { age: "10대", female: 8, male: 4 },
      { age: "20대", female: 31, male: 22 },
      { age: "30대", female: 14, male: 13 },
      { age: "40대", female: 5, male: 3 },
    ]
    if (withGender.length > 50) {
      const withBirth = users.filter(u => u.birthYear && u.gender)
      const currentYear = new Date().getFullYear()
      const ageGroups: Record<string, { f: number; m: number }> = {
        "10대": { f: 0, m: 0 }, "20대": { f: 0, m: 0 },
        "30대": { f: 0, m: 0 }, "40대": { f: 0, m: 0 },
      }
      withBirth.forEach(u => {
        const age = currentYear - (u.birthYear ?? currentYear)
        const grp = age < 20 ? "10대" : age < 30 ? "20대" : age < 40 ? "30대" : "40대"
        if (u.gender === "female") ageGroups[grp].f++
        else ageGroups[grp].m++
      })
      // 퍼센트 변환
      const totalAge = withBirth.length || 1
      ageBreakdown.splice(0, 4,
        ...Object.entries(ageGroups).map(([age, v]) => ({
          age, female: Math.round(v.f / totalAge * 100), male: Math.round(v.m / totalAge * 100)
        }))
      )
    }

    // 매장 랭킹
    const storeReviewMap: Record<string, { reviews: number; totalAmount: number }> = {}
    reviews.forEach(r => {
      if (!storeReviewMap[r.storeName]) storeReviewMap[r.storeName] = { reviews: 0, totalAmount: 0 }
      storeReviewMap[r.storeName].reviews++
      storeReviewMap[r.storeName].totalAmount += r.amount ?? 0
    })
    const storeRanking = Object.entries(storeReviewMap)
      .map(([name, d]) => ({ name, reviews: d.reviews, avgAmount: d.reviews ? Math.round(d.totalAmount / d.reviews) : 0 }))
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 10)

    // 시간대별 (0~23시)
    const hourlyData = Array(24).fill(0)
    reviews.forEach(r => {
      const h = new Date(r.createdAt).getHours()
      hourlyData[h]++
    })

    // 요일별
    const DOW = ["월", "화", "수", "목", "금", "토", "일"]
    const dowCounts = Array(7).fill(0)
    reviews.forEach(r => {
      const d = (new Date(r.createdAt).getDay() + 6) % 7  // 월=0
      dowCounts[d]++
    })
    const dowData = DOW.map((day, i) => ({ day, count: dowCounts[i] }))

    return NextResponse.json({
      totalUsers,
      totalReviews,
      avgAmount,
      activeStores,
      platformBreakdown,
      weeklyTrend,
      genderBreakdown,
      ageBreakdown,
      storeRanking,
      hourlyData,
      dowData,
    })
  } catch (err) {
    console.error("insights error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

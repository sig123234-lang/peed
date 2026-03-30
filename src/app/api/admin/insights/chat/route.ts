import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { message, stats } = await req.json()
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 })

    // DB에서 실시간 요약 데이터 가져오기
    const [totalUsers, totalReviews, totalStores] = await Promise.all([
      prisma.user.count(),
      prisma.review.count(),
      prisma.store.count({ where: { active: true } }),
    ])

    const systemPrompt = `당신은 PEED(위치 기반 리워드 앱)의 데이터 분석 AI입니다.
현재 PEED 데이터 현황:
- 전체 유저: ${totalUsers}명
- 전체 리뷰: ${totalReviews}건
- 활성 매장: ${totalStores}개
${stats ? `- 평균 결제금액: ${stats.avgAmount?.toLocaleString()}원` : ""}

다음 규칙을 따르세요:
1. 한국어로 답변
2. 데이터 기반 인사이트 제공
3. 간결하고 실용적인 답변 (3~5문장)
4. 마케팅/영업 전략 제안 시 구체적 수치 포함
5. 이모지 적절히 활용`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    })

    const reply = response.content[0].type === "text" ? response.content[0].text : "분석 중 오류가 발생했어요."
    return NextResponse.json({ reply })
  } catch (err) {
    console.error("AI insight chat error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

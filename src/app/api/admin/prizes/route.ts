import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// KST(UTC+9) datetime-local 값을 UTC Date로 변환
function kstToUtc(localDatetime: string): Date {
  // datetime-local 형식: "2026-04-01T23:00"
  // KST = UTC + 9h → UTC = KST - 9h
  const date = new Date(localDatetime)
  // datetime-local은 타임존 없이 들어오므로 UTC로 파싱됨
  // 실제 의도는 KST이므로 9시간 빼줌
  return new Date(date.getTime() - 9 * 60 * 60 * 1000)
}

export async function GET() {
  try {
    const prizes = await prisma.prize.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { winners: true, applications: true } },
      },
    })

    const result = prizes.map(p => ({
      id: p.id,
      name: p.name,
      emoji: (p as any).emoji ?? '🎁',
      imageUrl: (p as any).imageUrl ?? null,
      description: (p as any).description ?? null,
      value: Number((p as any).value) || p.cost,
      stock: p.maxWinners,
      totalGiven: p._count.winners,
      drawCount: p._count.applications,
      active: p.active,
      drawAt: p.drawAt
        ? new Date(p.drawAt.getTime() + 9 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16) // "YYYY-MM-DDTHH:mm" KST로 변환해서 내려줌
        : null,
      maxWinners: p.maxWinners,
      createdAt: p.createdAt.toISOString(),
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/admin/prizes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, imageUrl, description, value, stock, maxWinners, drawAt, active } = await req.json()

    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    const data: any = {
      name,
      emoji: '🎁',
      cost: Number(value) || 0,
      maxWinners: Number(maxWinners) || 1,
      maxApply: 500,
      value: String(value),
      active: active ?? true,
      weekStart: new Date(),
    }

    if (drawAt) data.drawAt = kstToUtc(drawAt)  // KST → UTC 변환
    if (imageUrl) data.imageUrl = imageUrl
    if (description) data.description = description

    const prize = await (prisma.prize.create as any)({ data })
    return NextResponse.json(prize, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/prizes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name, value, stock, maxWinners, drawAt, active, imageUrl, description, emoji } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (value !== undefined) { updateData.value = String(value); updateData.cost = Number(value) }
    if (stock !== undefined) { updateData.maxWinners = Number(stock); updateData.maxApply = 500 }
    if (maxWinners !== undefined) updateData.maxWinners = Number(maxWinners)
    if (active !== undefined) updateData.active = active
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (description !== undefined) updateData.description = description
    if (emoji !== undefined) updateData.emoji = emoji
    if (drawAt !== undefined) updateData.drawAt = drawAt ? kstToUtc(drawAt) : null  // KST → UTC

    const prize = await prisma.prize.update({ where: { id: Number(id) }, data: updateData })
    return NextResponse.json(prize)
  } catch (err) {
    console.error('PATCH /api/admin/prizes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.prize.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/prizes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

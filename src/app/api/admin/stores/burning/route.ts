import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ── POST: 버닝 등록 ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { storeId, start, weeks, fee, pb } = await req.json()

    if (!storeId || !start) {
      return NextResponse.json({ error: 'storeId and start required' }, { status: 400 })
    }

    const contractStart = new Date(start)
    const contractEnd = new Date(start)
    contractEnd.setDate(contractEnd.getDate() + weeks * 7)

    // Store를 버닝으로 업데이트
    const store = await prisma.store.update({
      where: { id: Number(storeId) },
      data: {
        storeType: 'burning',
        contractStart,
        contractWeeks: Number(weeks) || 4,
        monthlyFee: Number(fee) * 10000 || 100000,
        pb: Number(pb) || 10,
        active: true,
      } as any,
    })

    // history JSON 필드에 회차 추가
    const currentHistory = (store as any).history ?? []
    const newEntry = {
      id: Date.now(),
      start,
      weeks: Number(weeks),
      fee: Number(fee),
      reviews: 0,
      amt: 0,
      status: '진행중',
    }

    await prisma.store.update({
      where: { id: Number(storeId) },
      data: { history: [...currentHistory, newEntry] } as any,
    })

    return NextResponse.json({ success: true, store })
  } catch (err) {
    console.error('POST /api/admin/stores/burning error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

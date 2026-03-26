import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { name, emoji, cost, maxWinners, maxApply, value, drawAt } = await req.json()

  const prize = await prisma.prize.create({
    data: {
      name,
      emoji,
      cost: Number(cost),
      maxWinners: Number(maxWinners),
      maxApply: Number(maxApply),
      value,
      active: true,
      weekStart: new Date(),
      ...(drawAt ? { drawAt: new Date(drawAt) } : {}),
    } as any,
  })

  return NextResponse.json(prize, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  await prisma.prize.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
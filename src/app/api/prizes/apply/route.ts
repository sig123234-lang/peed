import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { prizeId, count } = await req.json()
  if (!prizeId || !count) {
    return NextResponse.json({ error: 'prizeId and count are required' }, { status: 400 })
  }
  const prize = await prisma.prize.findUnique({ where: { id: prizeId } })
  if (!prize || !prize.active) {
    return NextResponse.json({ error: 'Prize not found' }, { status: 404 })
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const totalCost = prize.cost * count
  if (!user || user.pb < totalCost) {
    return NextResponse.json({ error: 'Not enough PB' }, { status: 400 })
  }
  const existing = await prisma.application.findUnique({
    where: { userId_prizeId: { userId: session.user.id, prizeId } },
  })
  const result = await prisma.$transaction([
    existing
      ? prisma.application.update({
          where: { userId_prizeId: { userId: session.user.id, prizeId } },
          data: { count: existing.count + count },
        })
      : prisma.application.create({
          data: { userId: session.user.id, prizeId, count },
        }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { pb: { decrement: totalCost } },
    }),
  ])
  return NextResponse.json(result[0], { status: 201 })
}
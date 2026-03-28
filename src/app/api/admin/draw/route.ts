import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const now = new Date()

  const prizes = await prisma.prize.findMany({
    where: {
      active: true,
      drawAt: { lte: now },
    },
    include: {
      applications: { include: { user: true } },
      winners: true,
    }
  })

  const results = []

  for (const prize of prizes) {
    if (prize.winners.length >= prize.maxWinners) continue
    if (prize.applications.length === 0) continue

    const shuffled = prize.applications.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, prize.maxWinners)

    for (const app of selected) {
      const alreadyWon = prize.winners.some(w => w.userId === app.userId)
      if (alreadyWon) continue

      await prisma.winner.create({
        data: {
          userId: app.userId,
          prizeId: prize.id,
        }
      })
    }

    await prisma.prize.update({
      where: { id: prize.id },
      data: { active: false }
    })

    results.push({ prizeId: prize.id, prizeName: prize.name, winners: selected.length })
  }

  return NextResponse.json({ success: true, results })
}
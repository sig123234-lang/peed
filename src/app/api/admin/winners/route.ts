import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const winners = await prisma.winner.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          referralCode: true,
        }
      },
      prize: {
        select: {
          id: true,
          name: true,
          emoji: true,
          value: true,
          drawAt: true,
        }
      }
    }
  })
  return NextResponse.json(winners)
}
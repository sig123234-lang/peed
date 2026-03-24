import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  })
  return NextResponse.json(reviews)
}

export async function PATCH(req: NextRequest) {
  const { id, status, pb } = await req.json()

  const review = await prisma.review.update({
    where: { id },
    data: { status, pbAwarded: pb },
  })

  if (status === 'approved' && pb > 0) {
    await prisma.user.update({
      where: { id: review.userId },
      data: {
        pb: { increment: pb },
        reviewCount: { increment: 1 },
      },
    })
  }

  return NextResponse.json(review)
}
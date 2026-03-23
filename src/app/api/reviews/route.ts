import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { storeName, platform, menu, people, amount, screenshotUrl, storeId } = body
  if (!storeName || !platform) {
    return NextResponse.json({ error: 'storeName and platform are required' }, { status: 400 })
  }
  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      storeName,
      platform,
      menu,
      people: people ? parseInt(people) : null,
      amount: amount ? parseInt(amount.toString().replace(/,/g, '')) : null,
      screenshotUrl,
      storeId: storeId ? parseInt(storeId) : null,
      status: 'pending',
    },
  })
  return NextResponse.json(review, { status: 201 })
}
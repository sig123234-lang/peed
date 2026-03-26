import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      pb: true,
      reviewCount: true,
      phoneNumber: true,
      referralCode: true,
      createdAt: true,
    }
  })
  return NextResponse.json(users)
}
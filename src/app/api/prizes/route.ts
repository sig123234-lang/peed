import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  const prizes = await prisma.prize.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  })
  if (!session?.user?.id) {
    return NextResponse.json(prizes.map(p => ({ ...p, myApplications: 0 })))
  }
  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
  })
  const prizesWithApp = prizes.map(p => ({
    ...p,
    myApplications: applications.find(a => a.prizeId === p.id)?.count ?? 0,
  }))
  return NextResponse.json(prizesWithApp)
}
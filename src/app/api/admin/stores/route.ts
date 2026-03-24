import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { name, category, area, address, hours, emoji, tag, pb, lat, lng } = await req.json()

  const store = await prisma.store.create({
    data: {
      name,
      category,
      area,
      address,
      hours,
      emoji,
      tag,
      pb: Number(pb),
      lat: Number(lat) || 37.5563,
      lng: Number(lng) || 126.9236,
      certified: false,
      active: true,
      contractStart: new Date(),
      contractWeeks: 4,
      monthlyFee: 100000,
    },
  })

  return NextResponse.json(store, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  await prisma.store.delete({ where: { id: Number(id) } })

  return NextResponse.json({ success: true })
}
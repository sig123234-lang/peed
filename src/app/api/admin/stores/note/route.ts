import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { storeId, text } = await req.json()
    if (!storeId || !text) return NextResponse.json({ error: 'storeId and text required' }, { status: 400 })

    const store = await prisma.store.findUnique({ where: { id: Number(storeId) } })
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const today = new Date().toISOString().split('T')[0]
    const current = (store as any).contacts ?? []

    current.unshift({ text, date: today, type: 'note' })

    await prisma.store.update({
      where: { id: Number(storeId) },
      data: { contacts: current } as any,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/admin/stores/note error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { storeId, type } = await req.json()
    if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 })

    const store = await prisma.store.findUnique({ where: { id: Number(storeId) } })
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const today = new Date().toISOString().split('T')[0]
    const currentSent = (store as any).smsSentDates ?? []
    const newContacts = (store as any).contacts ?? []

    newContacts.unshift({
      text: type === 'inquiry' ? '소명 요청 문자 발송' : type === 'cancel' ? '취소 안내 문자 발송' : '재계약 문자 발송',
      date: today,
      type: 'sms',
    })

    await prisma.store.update({
      where: { id: Number(storeId) },
      data: {
        smsSentCount: { increment: 1 },
        smsSentDates: [...currentSent, today],
        contacts: newContacts,
      } as any,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/admin/stores/sms error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

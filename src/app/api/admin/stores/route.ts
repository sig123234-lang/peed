import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ── GET: 매장 목록 (히스토리 포함) ───────────────
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // BurningHistory가 별도 테이블 없으므로 Store 필드로 구성
    const result = stores.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      area: s.area,
      address: s.address,
      storeType: s.storeType,
      pb: s.pb,
      monthlyFee: s.monthlyFee,
      contractStart: s.contractStart?.toISOString().split('T')[0] ?? null,
      contractWeeks: s.contractWeeks,
      naverUrl: s.naverUrl ?? null,
      contactName: (s as any).contactName ?? null,
      contactPhone: (s as any).contactPhone ?? null,
      memo: (s as any).memo ?? null,
      possibility: (s as any).possibility ?? null,
      smsSentCount: (s as any).smsSentCount ?? 0,
      active: s.active,
      // 히스토리는 JSON 필드 또는 빈 배열
      history: (s as any).history ?? [],
      contacts: (s as any).contacts ?? [],
      createdAt: s.createdAt.toISOString(),
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/admin/stores error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST: 매장 추가 ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, category, address, contactName, contactPhone,
      naverUrl, storeType, memo,
    } = body

    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    const area = address?.match(/([가-힣]+구|[가-힣]+시 [가-힣]+구)/)?.[1] ?? address?.split(' ')[1] ?? ''

    const store = await prisma.store.create({
      data: {
        name,
        category: category || '기타',
        area,
        address: address || '',
        hours: '',
        emoji: '🏪',
        tag: '',
        pb: 10,
        lat: 37.5563,
        lng: 126.9236,
        storeType: storeType || 'prospect',
        certified: false,
        active: true,
        contractStart: new Date(),
        contractWeeks: 4,
        monthlyFee: 100000,
        // 확장 필드 (스키마에 있을 경우)
        ...(contactName !== undefined && { contactName }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(naverUrl !== undefined && { naverUrl }),
        ...(memo !== undefined && { memo }),
      } as any,
    })

    return NextResponse.json(store, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/stores error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PATCH: 매장 수정 (possibility, memo 등) ──────
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, possibility, memo, active, storeType, ...rest } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updateData: any = {}
    if (possibility !== undefined) updateData.possibility = possibility
    if (memo !== undefined) updateData.memo = memo
    if (active !== undefined) updateData.active = active
    if (storeType !== undefined) updateData.storeType = storeType
    // prospectStatus 하위 호환
    if (possibility !== undefined) updateData.prospectStatus = possibility

    const store = await prisma.store.update({
      where: { id: Number(id) },
      data: updateData,
    })

    return NextResponse.json(store)
  } catch (err) {
    console.error('PATCH /api/admin/stores error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE: 매장 삭제 ────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await prisma.store.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/stores error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

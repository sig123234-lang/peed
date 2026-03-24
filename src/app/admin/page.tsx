import Link from 'next/link'

export default function AdminPage() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#6C5CE7', marginBottom: '8px' }}>🛠️ PEED 어드민</h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>관리자 대시보드</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Link href="/admin/prizes" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: '#F8F7FF', borderRadius: '16px', padding: '24px', cursor: 'pointer', border: '2px solid #E0DCFF' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎁</div>
            <h2 style={{ color: '#6C5CE7', margin: '0 0 4px' }}>경품 관리</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>경품 등록 및 관리</p>
          </div>
        </Link>

        <Link href="/admin/stores" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: '#F8F7FF', borderRadius: '16px', padding: '24px', cursor: 'pointer', border: '2px solid #E0DCFF' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏪</div>
            <h2 style={{ color: '#6C5CE7', margin: '0 0 4px' }}>매장 관리</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>버닝 매장 등록 및 관리</p>
          </div>
        </Link>

        <Link href="/admin/reviews" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: '#F8F7FF', borderRadius: '16px', padding: '24px', cursor: 'pointer', border: '2px solid #E0DCFF' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
            <h2 style={{ color: '#6C5CE7', margin: '0 0 4px' }}>리뷰 승인</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>리뷰 인증 검토 및 PB 지급</p>
          </div>
        </Link>

        <Link href="/admin/users" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: '#F8F7FF', borderRadius: '16px', padding: '24px', cursor: 'pointer', border: '2px solid #E0DCFF' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
            <h2 style={{ color: '#6C5CE7', margin: '0 0 4px' }}>유저 관리</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>회원 목록 및 PB 관리</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
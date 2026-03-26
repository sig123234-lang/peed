import Link from "next/link"

export default function AdminPage() {
  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background:"#F5F7FF" }}>

      {/* 사이드바 */}
      <div style={{ width:"200px", background:"#fff", borderRight:"1px solid #E5E9FF", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"20px 16px", borderBottom:"1px solid #E5E9FF" }}>
          <div style={{ fontSize:"18px", fontWeight:"900", color:"#4A6CF7", letterSpacing:"-1px" }}>PEED</div>
          <div style={{ fontSize:"11px", color:"#9CA3AF", marginTop:"2px" }}>Admin Console</div>
        </div>
        <div style={{ padding:"12px 8px", flex:1 }}>
          <div style={{ marginBottom:"16px" }}>
            <div style={{ fontSize:"10px", fontWeight:"700", color:"#9CA3AF", letterSpacing:"1.5px", padding:"0 8px", marginBottom:"4px" }}>OVERVIEW</div>
            <div style={{ display:"flex", alignItems:"center", padding:"8px 10px", borderRadius:"8px", background:"#EEF2FF", fontSize:"12px", fontWeight:"700", color:"#4A6CF7", gap:"8px" }}>
              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#4A6CF7" }} />
              대시보드
            </div>
          </div>
          <div>
            <div style={{ fontSize:"10px", fontWeight:"700", color:"#9CA3AF", letterSpacing:"1.5px", padding:"0 8px", marginBottom:"4px" }}>MANAGEMENT</div>
            {[
              { href:"/admin/prizes", label:"경품 관리" },
              { href:"/admin/stores", label:"매장 관리" },
              { href:"/admin/users", label:"유저 관리" },
              { href:"/admin/reviews", label:"리뷰 내역" },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration:"none" }}>
                <div style={{ display:"flex", alignItems:"center", padding:"8px 10px", borderRadius:"8px", fontSize:"12px", fontWeight:"500", color:"#6B7280", gap:"8px", marginBottom:"2px", cursor:"pointer" }}>
                  <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#E5E9FF" }} />
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div style={{ padding:"12px 8px", borderTop:"1px solid #E5E9FF" }}>
          <Link href="/api/admin/auth" style={{ textDecoration:"none" }}>
            <button style={{ width:"100%", padding:"8px", border:"1px solid #E5E9FF", borderRadius:"8px", background:"none", fontSize:"12px", color:"#9CA3AF", cursor:"pointer" }}>
              로그아웃
            </button>
          </Link>
        </div>
      </div>

      {/* 메인 */}
      <div style={{ flex:1, padding:"24px", overflow:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
          <div style={{ fontSize:"18px", fontWeight:"700", color:"#1A1F36" }}>대시보드</div>
          <div style={{ background:"#EEF2FF", border:"1px solid #E5E9FF", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", fontWeight:"700", color:"#4A6CF7" }}>관리자</div>
        </div>

        {/* KPI */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"20px" }}>
          {[
            { label:"전체 유저", val:"-" },
            { label:"전체 리뷰", val:"-" },
            { label:"총 PB 적립", val:"-" },
            { label:"활성 매장", val:"-" },
          ].map(k => (
            <div key={k.label} style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", padding:"16px" }}>
              <div style={{ fontSize:"11px", color:"#9CA3AF", fontWeight:"500", marginBottom:"6px" }}>{k.label}</div>
              <div style={{ fontSize:"22px", fontWeight:"700", color:"#1A1F36" }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* 메뉴 카드 */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {[
            { href:"/admin/prizes", title:"경품 관리", desc:"경품 등록, 응모 현황, 자동 추첨" },
            { href:"/admin/stores", title:"매장 관리", desc:"버닝 매장 등록 및 관리" },
            { href:"/admin/users", title:"유저 관리", desc:"회원 목록 및 PB 현황" },
            { href:"/admin/reviews", title:"리뷰 내역", desc:"전체 리뷰 조회" },
          ].map(card => (
            <Link key={card.href} href={card.href} style={{ textDecoration:"none" }}>
              <div style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", padding:"20px", cursor:"pointer" }}>
                <div style={{ fontSize:"14px", fontWeight:"700", color:"#1A1F36", marginBottom:"4px" }}>{card.title}</div>
                <div style={{ fontSize:"12px", color:"#9CA3AF" }}>{card.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV = [
  { href: "/admin", label: "대시보드", exact: true },
  { href: "/admin/prizes", label: "경품 관리" },
  { href: "/admin/stores", label: "매장 관리" },
  { href: "/admin/users", label: "유저 관리" },
  { href: "/admin/reviews", label: "리뷰 내역" },
  { href: "/admin/winners", label: "당첨 내역" },
  { href: "/admin/insights", label: "인사이트" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" })
    window.location.href = "/admin/login"
  }

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background:"#F5F7FF" }}>
      <div style={{ width:"200px", background:"#fff", borderRight:"1px solid #E5E9FF", display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh" }}>
        <div style={{ padding:"20px 16px", borderBottom:"1px solid #E5E9FF" }}>
          <div style={{ fontSize:"18px", fontWeight:"900", color:"#4A6CF7", letterSpacing:"-1px" }}>PEED</div>
          <div style={{ fontSize:"11px", color:"#9CA3AF", marginTop:"2px" }}>Admin Console</div>
        </div>
        <div style={{ padding:"12px 8px", flex:1 }}>
          <div style={{ marginBottom:"16px" }}>
            <div style={{ fontSize:"10px", fontWeight:"700", color:"#9CA3AF", letterSpacing:"1.5px", padding:"0 8px", marginBottom:"4px" }}>OVERVIEW</div>
            {NAV.slice(0, 1).map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", padding:"8px 10px", borderRadius:"8px", background: active ? "#EEF2FF" : "transparent", fontSize:"12px", fontWeight: active ? "700" : "500", color: active ? "#4A6CF7" : "#6B7280", gap:"8px" }}>
                    <div style={{ width:"6px", height:"6px", borderRadius:"50%", background: active ? "#4A6CF7" : "#E5E9FF" }} />
                    {item.label}
                  </div>
                </Link>
              )
            })}
          </div>
          <div>
            <div style={{ fontSize:"10px", fontWeight:"700", color:"#9CA3AF", letterSpacing:"1.5px", padding:"0 8px", marginBottom:"4px" }}>MANAGEMENT</div>
            {NAV.slice(1).map(item => {
              const active = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", padding:"8px 10px", borderRadius:"8px", background: active ? "#EEF2FF" : "transparent", fontSize:"12px", fontWeight: active ? "700" : "500", color: active ? "#4A6CF7" : "#6B7280", gap:"8px", marginBottom:"2px" }}>
                    <div style={{ width:"6px", height:"6px", borderRadius:"50%", background: active ? "#4A6CF7" : "#E5E9FF" }} />
                    {item.label}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
        <div style={{ padding:"12px 8px", borderTop:"1px solid #E5E9FF" }}>
          <button onClick={handleLogout} style={{ width:"100%", padding:"8px", border:"1px solid #E5E9FF", borderRadius:"8px", background:"none", fontSize:"12px", color:"#9CA3AF", cursor:"pointer" }}>
            로그아웃
          </button>
        </div>
      </div>
      <div style={{ flex:1, overflow:"auto" }}>
        {children}
      </div>
    </div>
  )
}
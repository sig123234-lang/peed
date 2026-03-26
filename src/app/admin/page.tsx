"use client"
import { useEffect, useState } from "react"

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, reviews: 0, pb: 0, stores: 0 })

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        const totalPb = d.reduce((sum: number, u: any) => sum + (u.pb ?? 0), 0)
        setStats(s => ({ ...s, users: d.length, pb: totalPb }))
      }
    })
    fetch("/api/stores").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setStats(s => ({ ...s, stores: d.length }))
    })
    fetch("/api/admin/reviews").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setStats(s => ({ ...s, reviews: d.length }))
    })
  }, [])

  const KPI = [
    { label:"전체 유저", val: stats.users.toLocaleString() },
    { label:"전체 리뷰", val: stats.reviews.toLocaleString() },
    { label:"총 PB 적립", val: stats.pb.toLocaleString() },
    { label:"활성 매장", val: stats.stores.toLocaleString() },
  ]

  const MENUS = [
    { href:"/admin/prizes", title:"경품 관리", desc:"경품 등록, 응모 현황, 자동 추첨" },
    { href:"/admin/stores", title:"매장 관리", desc:"버닝 매장 등록 및 관리" },
    { href:"/admin/users", title:"유저 관리", desc:"회원 목록 및 PB 현황" },
    { href:"/admin/reviews", title:"리뷰 내역", desc:"전체 리뷰 조회" },
  ]

  return (
    <div style={{ padding:"24px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div style={{ fontSize:"18px", fontWeight:"700", color:"#1A1F36" }}>대시보드</div>
        <div style={{ background:"#EEF2FF", border:"1px solid #E5E9FF", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", fontWeight:"700", color:"#4A6CF7" }}>관리자</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"20px" }}>
        {KPI.map(k => (
          <div key={k.label} style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", padding:"16px" }}>
            <div style={{ fontSize:"11px", color:"#9CA3AF", fontWeight:"500", marginBottom:"6px" }}>{k.label}</div>
            <div style={{ fontSize:"22px", fontWeight:"700", color:"#1A1F36" }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
        {MENUS.map(card => (
          <a key={card.href} href={card.href} style={{ textDecoration:"none" }}>
            <div style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", padding:"20px", cursor:"pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#4A6CF7")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#E5E9FF")}>
              <div style={{ fontSize:"14px", fontWeight:"700", color:"#1A1F36", marginBottom:"4px" }}>{card.title}</div>
              <div style={{ fontSize:"12px", color:"#9CA3AF" }}>{card.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
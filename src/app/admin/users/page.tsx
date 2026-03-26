"use client"
import { useEffect, useState } from "react"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding:"24px" }}>
      <div style={{ marginBottom:"24px" }}>
        <div style={{ fontSize:"18px", fontWeight:"700", color:"#1A1F36" }}>유저 관리</div>
        <div style={{ fontSize:"12px", color:"#9CA3AF", marginTop:"2px" }}>전체 회원 목록 및 PB 현황을 확인합니다</div>
      </div>

      <div style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #E5E9FF" }}>
              {["이름", "이메일", "보유 PB", "리뷰 수", "가입일"].map(h => (
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:"11px", fontWeight:"700", color:"#9CA3AF", letterSpacing:"0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"#9CA3AF", fontSize:"13px" }}>로딩 중...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"#9CA3AF", fontSize:"13px" }}>등록된 유저가 없습니다</td></tr>
            ) : users.map(user => (
              <tr key={user.id} style={{ borderBottom:"1px solid #F5F7FF" }}>
                <td style={{ padding:"14px 16px", fontSize:"13px", fontWeight:"600", color:"#1A1F36" }}>{user.name ?? "-"}</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{user.email}</td>
                <td style={{ padding:"14px 16px" }}>
                  <span style={{ background:"#EEF2FF", color:"#4A6CF7", borderRadius:"6px", padding:"2px 8px", fontSize:"12px", fontWeight:"700" }}>
                    {user.pb ?? 0} PB
                  </span>
                </td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{user.reviewCount ?? 0}건</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#9CA3AF" }}>
                  {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
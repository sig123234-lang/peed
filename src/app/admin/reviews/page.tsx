"use client"
import { useEffect, useState } from "react"

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/reviews").then(r => r.json()).then(d => setReviews(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding:"24px" }}>
      <div style={{ marginBottom:"24px" }}>
        <div style={{ fontSize:"18px", fontWeight:"700", color:"#1A1F36" }}>리뷰 내역</div>
        <div style={{ fontSize:"12px", color:"#9CA3AF", marginTop:"2px" }}>전체 리뷰 인증 내역을 확인합니다</div>
      </div>

      <div style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #E5E9FF" }}>
              {["유저", "매장명", "플랫폼", "메뉴", "PB 지급", "인증일"].map(h => (
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:"11px", fontWeight:"700", color:"#9CA3AF", letterSpacing:"0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:"#9CA3AF", fontSize:"13px" }}>로딩 중...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:"#9CA3AF", fontSize:"13px" }}>리뷰 내역이 없습니다</td></tr>
            ) : reviews.map(review => (
              <tr key={review.id} style={{ borderBottom:"1px solid #F5F7FF" }}>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#1A1F36" }}>{review.user?.name ?? "-"}</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", fontWeight:"600", color:"#1A1F36" }}>{review.storeName}</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{review.platform}</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{review.menu ?? "-"}</td>
                <td style={{ padding:"14px 16px" }}>
                  <span style={{ background:"#EEF2FF", color:"#4A6CF7", borderRadius:"6px", padding:"2px 8px", fontSize:"12px", fontWeight:"700" }}>
                    +{review.pbAwarded ?? 2} PB
                  </span>
                </td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#9CA3AF" }}>
                  {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
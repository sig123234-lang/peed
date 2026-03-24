"use client"
import { useEffect, useState } from "react"

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then(res => res.json())
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const handleApprove = async (id: number, pb: number) => {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "approved", pb }),
    })
    setReviews(reviews.map(r => r.id === id ? { ...r, status: "approved" } : r))
  }

  const handleReject = async (id: number) => {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "rejected", pb: 0 }),
    })
    setReviews(reviews.map(r => r.id === id ? { ...r, status: "rejected" } : r))
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "#6C5CE7", textDecoration: "none" }}>← 어드민 홈</a>
      <h1 style={{ color: "#6C5CE7", margin: "16px 0" }}>📝 리뷰 승인</h1>

      {loading ? (
        <p>로딩 중...</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: "#888" }}>대기 중인 리뷰가 없어요</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#F8F7FF" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>매장명</th>
              <th style={{ padding: "12px", textAlign: "left" }}>플랫폼</th>
              <th style={{ padding: "12px", textAlign: "left" }}>메뉴</th>
              <th style={{ padding: "12px", textAlign: "left" }}>상태</th>
              <th style={{ padding: "12px", textAlign: "left" }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <tr key={review.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}>{review.storeName}</td>
                <td style={{ padding: "12px" }}>{review.platform}</td>
                <td style={{ padding: "12px" }}>{review.menu || "-"}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "8px",
                    backgroundColor: review.status === "approved" ? "#D1FAE5" : review.status === "rejected" ? "#FEE2E2" : "#F3F0FF",
                    color: review.status === "approved" ? "#065F46" : review.status === "rejected" ? "#991B1B" : "#6C5CE7",
                    fontSize: "12px"
                  }}>
                    {review.status === "approved" ? "승인" : review.status === "rejected" ? "거절" : "대기"}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  {review.status === "pending" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleApprove(review.id, 10)}
                        style={{ backgroundColor: "#6C5CE7", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}
                      >
                        승인 (+10 PB)
                      </button>
                      <button
                        onClick={() => handleReject(review.id)}
                        style={{ backgroundColor: "#FF6B6B", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}
                      >
                        거절
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
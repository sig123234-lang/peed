"use client"
import { useEffect, useState } from "react"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ fontFamily: "sans-serif", padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "#6C5CE7", textDecoration: "none" }}>← 어드민 홈</a>
      <h1 style={{ color: "#6C5CE7", margin: "16px 0" }}>👥 유저 관리</h1>

      {loading ? <p>로딩 중...</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#F8F7FF" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>이름</th>
              <th style={{ padding: "12px", textAlign: "left" }}>이메일</th>
              <th style={{ padding: "12px", textAlign: "left" }}>PB</th>
              <th style={{ padding: "12px", textAlign: "left" }}>리뷰 수</th>
              <th style={{ padding: "12px", textAlign: "left" }}>가입일</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}>{user.name ?? "-"}</td>
                <td style={{ padding: "12px" }}>{user.email}</td>
                <td style={{ padding: "12px" }}>{user.pb ?? 0} PB</td>
                <td style={{ padding: "12px" }}>{user.reviewCount ?? 0}개</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#888" }}>
                  {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
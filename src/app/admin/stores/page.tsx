"use client"
import { useEffect, useState } from "react"

export default function AdminStoresPage() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", category: "", area: "", address: "", hours: "", emoji: "🏪", tag: "", pb: 10, lat: 37.5563, lng: 126.9236 })

  useEffect(() => {
    fetch("/api/stores")
      .then(res => res.json())
      .then(data => setStores(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    const res = await fetch("/api/admin/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setStores([data, ...stores])
    setShowForm(false)
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/stores?id=${id}`, { method: "DELETE" })
    setStores(stores.filter(s => s.id !== id))
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "#6C5CE7", textDecoration: "none" }}>← 어드민 홈</a>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0" }}>
        <h1 style={{ color: "#6C5CE7", margin: 0 }}>🏪 매장 관리</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: "#6C5CE7", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", cursor: "pointer" }}>
          + 매장 추가
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: "#F8F7FF", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 16px" }}>새 매장 추가</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { label: "매장명", key: "name" },
              { label: "카테고리", key: "category" },
              { label: "지역", key: "area" },
              { label: "주소", key: "address" },
              { label: "영업시간", key: "hours" },
              { label: "이모지", key: "emoji" },
              { label: "태그", key: "tag" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label style={{ fontSize: "13px", color: "#888" }}>{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: "13px", color: "#888" }}>PB 적립량</label>
              <input type="number" value={form.pb} onChange={e => setForm({...form, pb: Number(e.target.value)})}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
          </div>
          <button onClick={handleSubmit}
            style={{ marginTop: "16px", backgroundColor: "#6C5CE7", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 24px", cursor: "pointer" }}>
            저장
          </button>
        </div>
      )}

      {loading ? <p>로딩 중...</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#F8F7FF" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>매장</th>
              <th style={{ padding: "12px", textAlign: "left" }}>카테고리</th>
              <th style={{ padding: "12px", textAlign: "left" }}>지역</th>
              <th style={{ padding: "12px", textAlign: "left" }}>PB</th>
              <th style={{ padding: "12px", textAlign: "left" }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {stores.map(store => (
              <tr key={store.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}>{store.emoji} {store.name}</td>
                <td style={{ padding: "12px" }}>{store.category}</td>
                <td style={{ padding: "12px" }}>{store.area}</td>
                <td style={{ padding: "12px" }}>+{store.pb} PB</td>
                <td style={{ padding: "12px" }}>
                  <button onClick={() => handleDelete(store.id)}
                    style={{ backgroundColor: "#FF6B6B", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
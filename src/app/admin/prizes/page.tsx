"use client"
import { useEffect, useState } from "react"

export default function AdminPrizesPage() {
  const [prizes, setPrizes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", emoji: "🎁", cost: 100, maxWinners: 1, maxApply: 500, value: "" })

  useEffect(() => {
    fetch("/api/prizes")
      .then(res => res.json())
      .then(data => setPrizes(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    const res = await fetch("/api/admin/prizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setPrizes([data, ...prizes])
    setShowForm(false)
    setForm({ name: "", emoji: "🎁", cost: 100, maxWinners: 1, maxApply: 500, value: "" })
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/prizes?id=${id}`, { method: "DELETE" })
    setPrizes(prizes.filter(p => p.id !== id))
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <a href="/admin" style={{ color: "#6C5CE7", textDecoration: "none" }}>← 어드민 홈</a>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0" }}>
        <h1 style={{ color: "#6C5CE7", margin: 0 }}>🎁 경품 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: "#6C5CE7", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", cursor: "pointer" }}
        >
          + 경품 추가
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: "#F8F7FF", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 16px" }}>새 경품 추가</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "#888" }}>경품명</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#888" }}>이모지</label>
              <input value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#888" }}>응모 PB</label>
              <input type="number" value={form.cost} onChange={e => setForm({...form, cost: Number(e.target.value)})}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#888" }}>최대 응모 인원</label>
              <input type="number" value={form.maxApply} onChange={e => setForm({...form, maxApply: Number(e.target.value)})}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#888" }}>당첨자 수</label>
              <input type="number" value={form.maxWinners} onChange={e => setForm({...form, maxWinners: Number(e.target.value)})}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", marginTop: "4px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#888" }}>경품 상세</label>
              <input value={form.value} onChange={e => setForm({...form, value: e.target.value})}
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
              <th style={{ padding: "12px", textAlign: "left" }}>경품</th>
              <th style={{ padding: "12px", textAlign: "left" }}>PB</th>
              <th style={{ padding: "12px", textAlign: "left" }}>최대 응모</th>
              <th style={{ padding: "12px", textAlign: "left" }}>당첨자</th>
              <th style={{ padding: "12px", textAlign: "left" }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {prizes.map(prize => (
              <tr key={prize.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}>{prize.emoji} {prize.name}</td>
                <td style={{ padding: "12px" }}>{prize.cost} PB</td>
                <td style={{ padding: "12px" }}>{prize.maxApply}명</td>
                <td style={{ padding: "12px" }}>{prize.maxWinners}명</td>
                <td style={{ padding: "12px" }}>
                  <button onClick={() => handleDelete(prize.id)}
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
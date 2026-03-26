"use client"
import { useEffect, useState } from "react"

const inputStyle = { width:"100%", padding:"8px 12px", borderRadius:"8px", border:"1px solid #E5E9FF", fontSize:"13px", outline:"none", boxSizing:"border-box" as const }
const labelStyle = { fontSize:"12px", fontWeight:"600" as const, color:"#6B7280", display:"block" as const, marginBottom:"4px" }

export default function AdminPrizesPage() {
  const [prizes, setPrizes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:"", emoji:"", cost:100, maxWinners:1, maxApply:500, value:"", drawAt:"" })

  useEffect(() => {
    fetch("/api/prizes").then(r => r.json()).then(d => setPrizes(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!form.name) return
    const res = await fetch("/api/admin/prizes", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) })
    const data = await res.json()
    setPrizes([data, ...prizes])
    setShowForm(false)
    setForm({ name:"", emoji:"", cost:100, maxWinners:1, maxApply:500, value:"", drawAt:"" })
  }

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return
    await fetch(`/api/admin/prizes?id=${id}`, { method:"DELETE" })
    setPrizes(prizes.filter(p => p.id !== id))
  }

  return (
    <div style={{ padding:"24px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <div style={{ fontSize:"18px", fontWeight:"700", color:"#1A1F36" }}>경품 관리</div>
          <div style={{ fontSize:"12px", color:"#9CA3AF", marginTop:"2px" }}>경품 등록 및 응모 현황을 관리합니다</div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:"8px 16px", background:"#4A6CF7", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
          + 경품 추가
        </button>
      </div>

      {showForm && (
        <div style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", padding:"24px", marginBottom:"20px" }}>
          <div style={{ fontSize:"14px", fontWeight:"700", color:"#1A1F36", marginBottom:"16px" }}>새 경품 등록</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px", marginBottom:"16px" }}>
            <div style={{ gridColumn:"1/3" }}>
              <label style={labelStyle}>경품명</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="경품 이름 입력" />
            </div>
            <div>
              <label style={labelStyle}>이모지 (선택)</label>
              <input style={inputStyle} value={form.emoji} onChange={e => setForm({...form, emoji:e.target.value})} placeholder="🎁" />
            </div>
            <div>
              <label style={labelStyle}>응모 PB</label>
              <input style={inputStyle} type="number" value={form.cost} onChange={e => setForm({...form, cost:Number(e.target.value)})} />
            </div>
            <div>
              <label style={labelStyle}>당첨자 수</label>
              <input style={inputStyle} type="number" value={form.maxWinners} onChange={e => setForm({...form, maxWinners:Number(e.target.value)})} />
            </div>
            <div>
              <label style={labelStyle}>최대 응모 인원</label>
              <input style={inputStyle} type="number" value={form.maxApply} onChange={e => setForm({...form, maxApply:Number(e.target.value)})} />
            </div>
            <div>
              <label style={labelStyle}>시가</label>
              <input style={inputStyle} value={form.value} onChange={e => setForm({...form, value:e.target.value})} placeholder="예) 329,000원" />
            </div>
            <div>
              <label style={labelStyle}>추첨 일시</label>
              <input style={inputStyle} type="datetime-local" value={form.drawAt} onChange={e => setForm({...form, drawAt:e.target.value})} />
            </div>
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={handleSubmit}
              style={{ padding:"8px 20px", background:"#4A6CF7", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
              저장
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding:"8px 20px", background:"none", color:"#6B7280", border:"1px solid #E5E9FF", borderRadius:"8px", fontSize:"13px", cursor:"pointer" }}>
              취소
            </button>
          </div>
        </div>
      )}

      <div style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #E5E9FF" }}>
              {["경품명", "응모 PB", "최대 응모", "당첨자 수", "추첨 일시", ""].map(h => (
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:"11px", fontWeight:"700", color:"#9CA3AF", letterSpacing:"0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:"#9CA3AF", fontSize:"13px" }}>로딩 중...</td></tr>
            ) : prizes.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:"#9CA3AF", fontSize:"13px" }}>등록된 경품이 없습니다</td></tr>
            ) : prizes.map(prize => (
              <tr key={prize.id} style={{ borderBottom:"1px solid #F5F7FF" }}>
                <td style={{ padding:"14px 16px", fontSize:"13px", fontWeight:"600", color:"#1A1F36" }}>{prize.emoji} {prize.name}</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{prize.cost} PB</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{prize.maxApply}명</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{prize.maxWinners}명</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>
                  {prize.drawAt ? new Date(prize.drawAt).toLocaleString("ko-KR") : "-"}
                </td>
                <td style={{ padding:"14px 16px" }}>
                  <button onClick={() => handleDelete(prize.id)}
                    style={{ padding:"5px 12px", background:"none", color:"#EF4444", border:"1px solid #FECACA", borderRadius:"6px", fontSize:"12px", cursor:"pointer" }}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
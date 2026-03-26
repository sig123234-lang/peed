"use client"
import { useEffect, useState } from "react"

const inputStyle = { width:"100%", padding:"8px 12px", borderRadius:"8px", border:"1px solid #E5E9FF", fontSize:"13px", outline:"none", boxSizing:"border-box" as const }
const labelStyle = { fontSize:"12px", fontWeight:"600" as const, color:"#6B7280", display:"block" as const, marginBottom:"4px" }

export default function AdminStoresPage() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:"", category:"", area:"", address:"", hours:"", emoji:"", tag:"", pb:10, lat:37.5563, lng:126.9236 })

  useEffect(() => {
    fetch("/api/stores").then(r => r.json()).then(d => setStores(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!form.name) return
    const res = await fetch("/api/admin/stores", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) })
    const data = await res.json()
    setStores([data, ...stores])
    setShowForm(false)
    setForm({ name:"", category:"", area:"", address:"", hours:"", emoji:"", tag:"", pb:10, lat:37.5563, lng:126.9236 })
  }

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return
    await fetch(`/api/admin/stores?id=${id}`, { method:"DELETE" })
    setStores(stores.filter(s => s.id !== id))
  }

  return (
    <div style={{ padding:"24px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <div style={{ fontSize:"18px", fontWeight:"700", color:"#1A1F36" }}>매장 관리</div>
          <div style={{ fontSize:"12px", color:"#9CA3AF", marginTop:"2px" }}>버닝 매장 등록 및 관리</div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:"8px 16px", background:"#4A6CF7", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
          + 매장 추가
        </button>
      </div>

      {showForm && (
        <div style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", padding:"24px", marginBottom:"20px" }}>
          <div style={{ fontSize:"14px", fontWeight:"700", color:"#1A1F36", marginBottom:"16px" }}>새 매장 등록</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px", marginBottom:"16px" }}>
            {[
              { label:"매장명", key:"name", placeholder:"매장 이름" },
              { label:"카테고리", key:"category", placeholder:"예) 카페, 음식점" },
              { label:"지역", key:"area", placeholder:"예) 성수동" },
              { label:"주소", key:"address", placeholder:"상세 주소" },
              { label:"영업시간", key:"hours", placeholder:"예) 09:00 - 22:00" },
              { label:"이모지", key:"emoji", placeholder:"🏪" },
              { label:"태그", key:"tag", placeholder:"예) 🔥 오늘 +247명" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input style={inputStyle} value={(form as any)[key]} onChange={e => setForm({...form, [key]:e.target.value})} placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label style={labelStyle}>PB 적립량</label>
              <input style={inputStyle} type="number" value={form.pb} onChange={e => setForm({...form, pb:Number(e.target.value)})} />
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
              {["매장명", "카테고리", "지역", "PB 적립", ""].map(h => (
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:"11px", fontWeight:"700", color:"#9CA3AF", letterSpacing:"0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"#9CA3AF", fontSize:"13px" }}>로딩 중...</td></tr>
            ) : stores.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"#9CA3AF", fontSize:"13px" }}>등록된 매장이 없습니다</td></tr>
            ) : stores.map(store => (
              <tr key={store.id} style={{ borderBottom:"1px solid #F5F7FF" }}>
                <td style={{ padding:"14px 16px", fontSize:"13px", fontWeight:"600", color:"#1A1F36" }}>{store.emoji} {store.name}</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{store.category}</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{store.area}</td>
                <td style={{ padding:"14px 16px" }}>
                  <span style={{ background:"#EEF2FF", color:"#4A6CF7", borderRadius:"6px", padding:"2px 8px", fontSize:"12px", fontWeight:"700" }}>
                    +{store.pb} PB
                  </span>
                </td>
                <td style={{ padding:"14px 16px" }}>
                  <button onClick={() => handleDelete(store.id)}
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
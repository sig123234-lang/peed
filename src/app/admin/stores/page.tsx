"use client"
import { useEffect, useState, useRef } from "react"

const CATEGORIES = ["음식점", "카페", "문화", "숙박", "뷰티", "병원", "기타"]

const inputStyle = { width:"100%", padding:"8px 12px", borderRadius:"8px", border:"1px solid #E5E9FF", fontSize:"13px", outline:"none", boxSizing:"border-box" as const }
const labelStyle = { fontSize:"12px", fontWeight:"600" as const, color:"#6B7280", display:"block" as const, marginBottom:"4px" }

function getCity(address: string) {
  if (!address) return "-"
  const match = address.match(/([가-힣]+시|[가-힣]+군|[가-힣]+구)/)
  return match ? match[1] : address.split(" ")[0]
}

function StoreTable({ title, stores, onDelete, onStatusChange, showProspect = false }: any) {
  return (
    <div style={{ marginBottom:"24px" }}>
      <div style={{ fontSize:"14px", fontWeight:"700", color:"#1A1F36", marginBottom:"12px" }}>{title} <span style={{ fontSize:"12px", color:"#9CA3AF", fontWeight:"400" }}>({stores.length}개)</span></div>
      <div style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #E5E9FF" }}>
              {["매장명", "카테고리", "지역", "PB 적립", ...(showProspect ? ["계약 가능성"] : []), ""].map((h, i) => (
                <th key={i} style={{ padding:"12px 16px", textAlign:"left", fontSize:"11px", fontWeight:"700", color:"#9CA3AF", letterSpacing:"0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stores.length === 0 ? (
              <tr><td colSpan={showProspect ? 6 : 5} style={{ padding:"32px", textAlign:"center", color:"#9CA3AF", fontSize:"13px" }}>매장이 없습니다</td></tr>
            ) : stores.map((store: any) => (
              <tr key={store.id} style={{ borderBottom:"1px solid #F5F7FF" }}>
                <td style={{ padding:"14px 16px", fontSize:"13px", fontWeight:"600", color:"#1A1F36" }}>{store.emoji} {store.name}</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{store.category}</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{getCity(store.address)}</td>
                <td style={{ padding:"14px 16px" }}>
                  <span style={{ background:"#EEF2FF", color:"#4A6CF7", borderRadius:"6px", padding:"2px 8px", fontSize:"12px", fontWeight:"700" }}>+{store.pb} PB</span>
                </td>
                {showProspect && (
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button onClick={() => onStatusChange(store.id, "green")}
                        style={{ padding:"4px 10px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:"700", background: store.prospectStatus === "green" ? "#10B981" : "#F1F5F9", color: store.prospectStatus === "green" ? "#fff" : "#9CA3AF" }}>
                        계약 가능
                      </button>
                      <button onClick={() => onStatusChange(store.id, "red")}
                        style={{ padding:"4px 10px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:"700", background: store.prospectStatus === "red" ? "#EF4444" : "#F1F5F9", color: store.prospectStatus === "red" ? "#fff" : "#9CA3AF" }}>
                        계약 어려움
                      </button>
                    </div>
                  </td>
                )}
                <td style={{ padding:"14px 16px" }}>
                  <button onClick={() => onDelete(store.id)}
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

export default function AdminStoresPage() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [storeType, setStoreType] = useState("burning")
  const [form, setForm] = useState({ name:"", category:"음식점", area:"", address:"", hours:"", emoji:"", tag:"", pb:10, lat:37.5563, lng:126.9236, storeType:"burning" })
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    fetch("/api/stores").then(r => r.json()).then(d => setStores(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!showForm) return
    setTimeout(() => {
      const container = document.getElementById("admin-map")
      if (!container || (window as any).kakao?.maps) return
      const script = document.createElement("script")
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=f6edd191b80399b1a902a37d8a2caed2&autoload=false`
      script.onload = () => {
        (window as any).kakao.maps.load(() => {
          const map = new (window as any).kakao.maps.Map(container, { center: new (window as any).kakao.maps.LatLng(37.5563, 126.9236), level: 5 })
          mapRef.current = map
          const marker = new (window as any).kakao.maps.Marker({ position: map.getCenter(), map })
          markerRef.current = marker
          ;(window as any).kakao.maps.event.addListener(map, "click", (e: any) => {
            const lat = e.latLng.getLat()
            const lng = e.latLng.getLng()
            marker.setPosition(e.latLng)
            setForm(f => ({ ...f, lat, lng }))
            const geocoder = new (window as any).kakao.maps.services.Geocoder()
            geocoder.coord2Address(lng, lat, (result: any, status: any) => {
              if (status === (window as any).kakao.maps.services.Status.OK) {
                const addr = result[0]?.road_address?.address_name || result[0]?.address?.address_name || ""
                setForm(f => ({ ...f, address: addr }))
              }
            })
          })
        })
      }
      document.head.appendChild(script)
    }, 100)
  }, [showForm])

  const handleSubmit = async () => {
    if (!form.name) return
    const res = await fetch("/api/admin/stores", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({...form, storeType}) })
    const data = await res.json()
    setStores([data, ...stores])
    setShowForm(false)
    setForm({ name:"", category:"음식점", area:"", address:"", hours:"", emoji:"", tag:"", pb:10, lat:37.5563, lng:126.9236, storeType:"burning" })
  }

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return
    await fetch(`/api/admin/stores?id=${id}`, { method:"DELETE" })
    setStores(stores.filter(s => s.id !== id))
  }

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/admin/stores`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id, prospectStatus: status }) })
    setStores(stores.map(s => s.id === id ? { ...s, prospectStatus: status } : s))
  }

  const filtered = stores.filter(s => s.name?.includes(search))
  const burning = filtered.filter(s => s.storeType === "burning" && s.active)
  const expired = filtered.filter(s => s.storeType === "burning" && !s.active)
  const prospect = filtered.filter(s => s.storeType === "prospect")

  return (
    <div style={{ padding:"24px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <div style={{ fontSize:"18px", fontWeight:"700", color:"#1A1F36" }}>매장 관리</div>
          <div style={{ fontSize:"12px", color:"#9CA3AF", marginTop:"2px" }}>버닝 매장 및 영업중 매장을 관리합니다</div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="매장명 검색"
            style={{ padding:"8px 12px", border:"1px solid #E5E9FF", borderRadius:"8px", fontSize:"13px", outline:"none", width:"180px" }} />
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding:"8px 16px", background:"#4A6CF7", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
            + 매장 추가
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", padding:"24px", marginBottom:"20px" }}>
          <div style={{ fontSize:"14px", fontWeight:"700", color:"#1A1F36", marginBottom:"16px" }}>새 매장 등록</div>

          <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
            {[{v:"burning", l:"버닝 매장"}, {v:"prospect", l:"영업중 매장"}].map(t => (
              <button key={t.v} onClick={() => setStoreType(t.v)}
                style={{ padding:"6px 16px", borderRadius:"8px", border:"1px solid", fontSize:"12px", fontWeight:"600", cursor:"pointer", borderColor: storeType === t.v ? "#4A6CF7" : "#E5E9FF", background: storeType === t.v ? "#EEF2FF" : "#fff", color: storeType === t.v ? "#4A6CF7" : "#6B7280" }}>
                {t.l}
              </button>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px", marginBottom:"16px" }}>
            <div style={{ gridColumn:"1/3" }}>
              <label style={labelStyle}>매장명</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="매장 이름" />
            </div>
            <div>
              <label style={labelStyle}>카테고리</label>
              <select style={inputStyle} value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>이모지</label>
              <input style={inputStyle} value={form.emoji} onChange={e => setForm({...form, emoji:e.target.value})} placeholder="🏪" />
            </div>
            <div>
              <label style={labelStyle}>영업시간</label>
              <input style={inputStyle} value={form.hours} onChange={e => setForm({...form, hours:e.target.value})} placeholder="09:00 - 22:00" />
            </div>
            <div>
              <label style={labelStyle}>PB 적립량</label>
              <input style={inputStyle} type="number" value={form.pb} onChange={e => setForm({...form, pb:Number(e.target.value)})} />
            </div>
          </div>

          <div style={{ marginBottom:"16px" }}>
            <label style={labelStyle}>지도에서 위치 선택 (클릭하여 핀 설정)</label>
            <div id="admin-map" style={{ width:"100%", height:"300px", borderRadius:"8px", border:"1px solid #E5E9FF", overflow:"hidden" }} />
            {form.address && <div style={{ marginTop:"6px", fontSize:"12px", color:"#4A6CF7", fontWeight:"600" }}>선택된 주소: {form.address}</div>}
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

      {loading ? <div style={{ textAlign:"center", padding:"40px", color:"#9CA3AF" }}>로딩 중...</div> : <>
        <StoreTable title="버닝 매장 (계약 중)" stores={burning} onDelete={handleDelete} />
        <StoreTable title="버닝 매장 (계약 만료)" stores={expired} onDelete={handleDelete} />
        <StoreTable title="영업중 매장" stores={prospect} onDelete={handleDelete} onStatusChange={handleStatusChange} showProspect={true} />
      </>}
    </div>
  )
}
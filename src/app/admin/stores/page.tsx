"use client"
import { useEffect, useState } from "react"

function getCity(address: string) {
  if (!address) return "-"
  const match = address.match(/([가-힣]+시|[가-힣]+군|[가-힣]+구)/)
  return match ? match[1] : address.split(" ")[0]
}

function StoreDetailModal({ store, onClose, onDelete }: any) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if(e.target === e.currentTarget) onClose() }}>
      <div style={{ background:"#fff", borderRadius:"16px", width:"560px", maxHeight:"80vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #E5E9FF", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:"16px", fontWeight:"700", color:"#1A1F36" }}>{store.emoji} {store.name}</div>
            <div style={{ fontSize:"12px", color:"#9CA3AF", marginTop:"2px" }}>{store.category} · {getCity(store.address)}</div>
          </div>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:"20px", cursor:"pointer", color:"#9CA3AF" }}>✕</button>
        </div>
        <div style={{ padding:"20px 24px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"20px" }}>
            {[
              { label:"PB 적립량", val:`+${store.pb} PB` },
              { label:"영업시간", val:store.hours || "-" },
              { label:"계약 시작일", val:store.contractStart ? new Date(store.contractStart).toLocaleDateString("ko-KR") : "-" },
              { label:"계약 기간", val:store.contractWeeks ? `${store.contractWeeks}주` : "-" },
              { label:"계약금", val:store.monthlyFee ? `${(store.monthlyFee/10000).toFixed(0)}만원` : "-" },
              { label:"매장 유형", val:store.storeType === "burning" ? "🔥 버닝 매장" : "🏪 영업중 매장" },
            ].map(item => (
              <div key={item.label} style={{ background:"#F5F7FF", borderRadius:"8px", padding:"12px" }}>
                <div style={{ fontSize:"11px", color:"#9CA3AF", fontWeight:"600", marginBottom:"4px" }}>{item.label}</div>
                <div style={{ fontSize:"13px", fontWeight:"600", color:"#1A1F36" }}>{item.val}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:"16px" }}>
            <div style={{ fontSize:"11px", color:"#9CA3AF", fontWeight:"600", marginBottom:"6px" }}>주소</div>
            <div style={{ fontSize:"13px", color:"#1A1F36" }}>{store.address || "-"}</div>
          </div>

          {store.naverUrl && (
            <a href={store.naverUrl} target="_blank" rel="noreferrer"
              style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", background:"#F0FFF8", border:"1px solid #D4F5E0", borderRadius:"8px", textDecoration:"none", marginBottom:"16px" }}>
              <span style={{ background:"#03C75A", color:"#fff", fontSize:"10px", fontWeight:"900", padding:"2px 6px", borderRadius:"3px" }}>N</span>
              <span style={{ fontSize:"13px", color:"#03C75A", fontWeight:"600" }}>네이버 플레이스 바로가기</span>
            </a>
          )}

          {store.prospectStatus && (
            <div style={{ marginBottom:"16px" }}>
              <div style={{ fontSize:"11px", color:"#9CA3AF", fontWeight:"600", marginBottom:"6px" }}>계약 가능성</div>
              <span style={{ background: store.prospectStatus === "green" ? "#E1F5EE" : "#FCEBEB", color: store.prospectStatus === "green" ? "#0F6E56" : "#A32D2D", borderRadius:"6px", padding:"4px 10px", fontSize:"12px", fontWeight:"700" }}>
                {store.prospectStatus === "green" ? "가능성 있음" : "가능성 낮음"}
              </span>
            </div>
          )}

          {store.desc && (
            <div style={{ marginBottom:"16px" }}>
              <div style={{ fontSize:"11px", color:"#9CA3AF", fontWeight:"600", marginBottom:"6px" }}>매장 소개</div>
              <div style={{ fontSize:"13px", color:"#1A1F36", lineHeight:"1.6" }}>{store.desc}</div>
            </div>
          )}
        </div>

        <div style={{ padding:"16px 24px", borderTop:"1px solid #E5E9FF", display:"flex", justifyContent:"space-between" }}>
          <button onClick={() => { onDelete(store.id); onClose() }}
            style={{ padding:"8px 16px", background:"none", color:"#EF4444", border:"1px solid #FECACA", borderRadius:"8px", fontSize:"13px", cursor:"pointer" }}>
            매장 삭제
          </button>
          <button onClick={onClose}
            style={{ padding:"8px 20px", background:"#4A6CF7", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

function StoreTable({ title, stores, onDelete, onStatusChange, onSelect, showProspect = false }: any) {
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
              <tr key={store.id} style={{ borderBottom:"1px solid #F5F7FF", cursor:"pointer" }} onClick={() => onSelect(store)}>
                <td style={{ padding:"14px 16px", fontSize:"13px", fontWeight:"600", color:"#4A6CF7", textDecoration:"underline" }}>{store.emoji} {store.name}</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{store.category}</td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#6B7280" }}>{getCity(store.address)}</td>
                <td style={{ padding:"14px 16px" }}>
                  <span style={{ background:"#EEF2FF", color:"#4A6CF7", borderRadius:"6px", padding:"2px 8px", fontSize:"12px", fontWeight:"700" }}>+{store.pb} PB</span>
                </td>
                {showProspect && (
                  <td style={{ padding:"14px 16px" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button onClick={() => onStatusChange(store.id, "green")}
                        style={{ padding:"4px 10px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:"700", background: store.prospectStatus === "green" ? "#10B981" : "#F1F5F9", color: store.prospectStatus === "green" ? "#fff" : "#9CA3AF" }}>
                        가능성 있음
                      </button>
                      <button onClick={() => onStatusChange(store.id, "red")}
                        style={{ padding:"4px 10px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:"700", background: store.prospectStatus === "red" ? "#EF4444" : "#F1F5F9", color: store.prospectStatus === "red" ? "#fff" : "#9CA3AF" }}>
                        가능성 낮음
                      </button>
                    </div>
                  </td>
                )}
                <td style={{ padding:"14px 16px" }} onClick={e => e.stopPropagation()}>
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

const CATS: any = {
  "음식·음료": [
    { emoji:"🍽️", label:"한식" }, { emoji:"🍜", label:"중식/일식/아시안" }, { emoji:"🍕", label:"양식" },
    { emoji:"🍗", label:"치킨/패스트푸드" }, { emoji:"🥩", label:"고기/구이" }, { emoji:"☕", label:"카페/디저트" }, { emoji:"🍺", label:"바/펍" }
  ],
  "뷰티·웰니스": [
    { emoji:"💇", label:"헤어샵" }, { emoji:"💅", label:"네일/뷰티" }, { emoji:"🧖", label:"스파/마사지" },
    { emoji:"🏋️", label:"헬스/피트니스" }, { emoji:"🧘", label:"필라테스/요가" }
  ],
  "여가·문화": [
    { emoji:"🎵", label:"노래방/라이브" }, { emoji:"🎳", label:"볼링/당구" }, { emoji:"📚", label:"독서실/스터디" },
    { emoji:"🎨", label:"공방/체험" }, { emoji:"🎠", label:"테마파크/놀이" }
  ],
  "쇼핑·서비스": [
    { emoji:"🛍️", label:"패션/의류" }, { emoji:"📱", label:"전자기기" }, { emoji:"🌿", label:"꽃집/인테리어" }, { emoji:"🏪", label:"기타" }
  ]
}

const S: any = {
  wrap: { padding:"24px", background:"#F5F7FF", minHeight:"100vh" },
  card: { background:"#fff", border:"0.5px solid #E5E9FF", borderRadius:"12px", overflow:"hidden" },
  cardHeader: { padding:"20px 24px 16px", borderBottom:"0.5px solid #E5E9FF" },
  cardBody: { padding:"24px" },
  sectionLabel: { fontSize:"11px", fontWeight:"500" as const, letterSpacing:"0.06em", color:"#9CA3AF", textTransform:"uppercase" as const, marginBottom:"12px", marginTop:"28px", display:"block" as const },
  field: { display:"flex" as const, flexDirection:"column" as const, gap:"6px" },
  label: { fontSize:"12px", color:"#6B7280", fontWeight:"500" as const },
  input: { background:"#F5F7FF", border:"0.5px solid #E5E9FF", borderRadius:"8px", padding:"10px 12px", fontSize:"14px", color:"#1A1F36", outline:"none", width:"100%", fontFamily:"inherit" },
  divider: { border:"none", borderTop:"0.5px solid #E5E9FF", margin:"24px 0" },
  footer: { display:"flex" as const, justifyContent:"flex-end" as const, gap:"8px", padding:"16px 24px", borderTop:"0.5px solid #E5E9FF", background:"#F5F7FF" },
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedStore, setSelectedStore] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [storeType, setStoreType] = useState("burning")
  const [selectedCat, setSelectedCat] = useState("")
  const [selectedCatEmoji, setSelectedCatEmoji] = useState("")
  const [contractStatus, setContractStatus] = useState("")
  const [form, setForm] = useState({ name:"", hours:"", pb:10, contractWeeks:4, weeklyFee:50, address:"", addressDetail:"", naverUrl:"", memo:"", lat:37.5563, lng:126.9236 })

  useEffect(() => {
    fetch("/api/stores").then(r => r.json()).then(d => setStores(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!form.name) return
    const res = await fetch("/api/admin/stores", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        ...form,
        category: selectedCat,
        emoji: selectedCatEmoji,
        storeType,
        prospectStatus: contractStatus,
        tag: "",
        area: form.address.split(" ")[1] || "",
        monthlyFee: form.weeklyFee * 10000,
      })
    })
    const data = await res.json()
    setStores([data, ...stores])
    setShowForm(false)
    setForm({ name:"", hours:"", pb:10, contractWeeks:4, weeklyFee:50, address:"", addressDetail:"", naverUrl:"", memo:"", lat:37.5563, lng:126.9236 })
    setSelectedCat("")
    setSelectedCatEmoji("")
    setContractStatus("")
  }

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return
    await fetch(`/api/admin/stores?id=${id}`, { method:"DELETE" })
    setStores(stores.filter(s => s.id !== id))
  }

  const handleStatusChange = async (id: number, status: string) => {
    await fetch("/api/admin/stores", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id, prospectStatus: status }) })
    setStores(stores.map(s => s.id === id ? { ...s, prospectStatus: status } : s))
  }

  const filtered = stores.filter(s => s.name?.includes(search))
  const burning = filtered.filter(s => s.storeType === "burning" && s.active)
  const expired = filtered.filter(s => s.storeType === "burning" && !s.active)
  const prospect = filtered.filter(s => s.storeType === "prospect")

  if (showForm) return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.cardHeader}>
          <h2 style={{ fontSize:"16px", fontWeight:"500", color:"#1A1F36" }}>새 매장 등록</h2>
          <p style={{ fontSize:"13px", color:"#6B7280", marginTop:"4px" }}>매장 정보를 입력하고 저장하세요</p>
        </div>
        <div style={S.cardBody}>
          <span style={{ ...S.sectionLabel, marginTop:0 }}>매장 유형 <span style={{ color:"#E24B4A" }}>*</span></span>
          <div style={{ display:"flex", gap:"4px", background:"#F5F7FF", border:"0.5px solid #E5E9FF", borderRadius:"8px", padding:"3px" }}>
            {[{v:"burning",l:"🔥 버닝 매장"},{v:"prospect",l:"🏪 영업중 매장"}].map(t => (
              <button key={t.v} onClick={() => setStoreType(t.v)}
                style={{ flex:1, padding:"9px 0", borderRadius:"6px", fontSize:"14px", fontWeight:"500", border:"none", cursor:"pointer", background: storeType === t.v ? "#fff" : "transparent", color: storeType === t.v ? "#1A1F36" : "#6B7280" }}>
                {t.l}
              </button>
            ))}
          </div>

          <span style={S.sectionLabel}>매장명 <span style={{ color:"#E24B4A" }}>*</span></span>
          <div style={S.field}>
            <input style={S.input} placeholder="매장 이름 입력" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
          </div>

          <span style={S.sectionLabel}>카테고리 <span style={{ color:"#E24B4A" }}>*</span></span>
          {Object.entries(CATS).map(([group, items]: any) => (
            <div key={group} style={{ marginBottom:"14px" }}>
              <div style={{ fontSize:"12px", fontWeight:"500", color:"#6B7280", marginBottom:"8px" }}>{group}</div>
              <div style={{ display:"flex", flexWrap:"wrap" as const, gap:"7px" }}>
                {items.map((item: any) => (
                  <div key={item.label} onClick={() => { setSelectedCat(item.label); setSelectedCatEmoji(item.emoji) }}
                    style={{ border: selectedCat === item.label ? "0.5px solid #4F8EF7" : "0.5px solid #E5E9FF", borderRadius:"20px", padding:"7px 14px", display:"flex", alignItems:"center", gap:"6px", cursor:"pointer", background: selectedCat === item.label ? "#E8F0FE" : "#F5F7FF", fontSize:"13px", color: selectedCat === item.label ? "#2563EB" : "#1A1F36" }}>
                    <span style={{ fontSize:"15px" }}>{item.emoji}</span>{item.label}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <span style={S.sectionLabel}>매장 사진</span>
          <div style={{ border:"1.5px dashed #E5E9FF", borderRadius:"12px", padding:"28px", display:"flex", flexDirection:"column" as const, alignItems:"center", gap:"6px", cursor:"pointer", background:"#F5F7FF" }}>
            <strong style={{ fontSize:"13px", fontWeight:"500", color:"#1A1F36" }}>📷 사진을 드래그하거나 클릭해서 업로드</strong>
            <span style={{ fontSize:"12px", color:"#6B7280" }}>JPG, PNG · 최대 5장 · 각 10MB 이하</span>
          </div>

          <span style={S.sectionLabel}>운영 정보</span>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div style={S.field}>
              <label style={S.label}>영업시간</label>
              <input style={S.input} placeholder="09:00 - 22:00" value={form.hours} onChange={e => setForm({...form, hours:e.target.value})} />
            </div>
            <div style={S.field}>
              <label style={S.label}>PB 적립량 <span style={{ color:"#E24B4A" }}>*</span></label>
              <input style={S.input} type="number" value={form.pb} onChange={e => setForm({...form, pb:Number(e.target.value)})} />
            </div>
          </div>

          {storeType === "burning" && (
            <>
              <hr style={S.divider} />
              <span style={{ ...S.sectionLabel, marginTop:0 }}>계약 정보</span>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                <div style={S.field}>
                  <label style={S.label}>계약기간 <span style={{ color:"#E24B4A" }}>*</span></label>
                  <div style={{ position:"relative" }}>
                    <input style={{ ...S.input, paddingRight:"44px" }} type="number" value={form.contractWeeks} onChange={e => setForm({...form, contractWeeks:Number(e.target.value)})} />
                    <span style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"13px", color:"#9CA3AF" }}>주</span>
                  </div>
                </div>
                <div style={S.field}>
                  <label style={S.label}>계약금 <span style={{ color:"#E24B4A" }}>*</span></label>
                  <div style={{ position:"relative" }}>
                    <input style={{ ...S.input, paddingRight:"52px" }} type="number" value={form.weeklyFee} onChange={e => setForm({...form, weeklyFee:Number(e.target.value)})} />
                    <span style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"13px", color:"#9CA3AF" }}>만원</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <hr style={S.divider} />
          <span style={{ ...S.sectionLabel, marginTop:0 }}>주소 및 위치</span>
          <div style={{ ...S.field, marginBottom:"8px" }}>
            <input style={S.input} placeholder="도로명 주소 검색" value={form.address} onChange={e => setForm({...form, address:e.target.value})} />
          </div>
          <div style={{ ...S.field, marginBottom:"12px" }}>
            <input style={S.input} placeholder="상세 주소 (동/호수 등)" value={form.addressDetail} onChange={e => setForm({...form, addressDetail:e.target.value})} />
          </div>
          <div style={{ border:"0.5px solid #E5E9FF", borderRadius:"8px", height:"150px", background:"#F5F7FF", display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center", gap:"8px", cursor:"pointer" }}>
            <div style={{ width:"22px", height:"22px", borderRadius:"50% 50% 50% 0", background:"#4F8EF7", transform:"rotate(-45deg)" }} />
            <span style={{ fontSize:"13px", color:"#6B7280" }}>지도를 클릭해서 핀 설정</span>
          </div>

          <span style={S.sectionLabel}>네이버 플레이스</span>
          <div style={{ display:"flex", gap:"8px" }}>
            <input style={{ ...S.input, flex:1 }} placeholder="https://naver.me/... URL 붙여넣기" value={form.naverUrl} onChange={e => setForm({...form, naverUrl:e.target.value})} />
            <button style={{ background:"#03C75A", borderRadius:"8px", padding:"10px 16px", fontSize:"13px", fontWeight:"500", color:"#fff", border:"none", cursor:"pointer", whiteSpace:"nowrap" as const }}>N 연결</button>
          </div>

          {storeType === "prospect" && (
            <>
              <hr style={S.divider} />
              <span style={{ ...S.sectionLabel, marginTop:0 }}>계약 가능성 <span style={{ color:"#E24B4A" }}>*</span></span>
              <div style={{ display:"flex", gap:"8px" }}>
                {[{v:"green",l:"가능성 있음",ac:"#1D9E75",bg:"#E1F5EE"},{v:"red",l:"가능성 낮음",ac:"#E24B4A",bg:"#FCEBEB"}].map(c => (
                  <div key={c.v} onClick={() => setContractStatus(c.v)}
                    style={{ flex:1, border: contractStatus === c.v ? `0.5px solid ${c.ac}` : "0.5px solid #E5E9FF", borderRadius:"8px", padding:"12px", display:"flex", flexDirection:"column" as const, alignItems:"center", gap:"6px", cursor:"pointer", background: contractStatus === c.v ? c.bg : "#F5F7FF" }}>
                    <div style={{ width:"14px", height:"14px", borderRadius:"50%", background:c.ac }} />
                    <span style={{ fontSize:"13px", fontWeight:"500", color: contractStatus === c.v ? c.ac : "#1A1F36" }}>{c.l}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <hr style={S.divider} />
          <span style={{ ...S.sectionLabel, marginTop:0 }}>관리자 메모</span>
          <textarea
            style={{ background:"#FAEEDA", border:"0.5px solid #FAC775", borderRadius:"8px", padding:"10px 12px", fontSize:"14px", color:"#633806", outline:"none", width:"100%", fontFamily:"inherit", resize:"none" as const, height:"100px", lineHeight:"1.6" }}
            placeholder="내부 메모를 입력하세요 (앱에 노출되지 않습니다)"
            value={form.memo} onChange={e => setForm({...form, memo:e.target.value})}
          />
        </div>
        <div style={S.footer}>
          <button onClick={() => setShowForm(false)} style={{ border:"0.5px solid #E5E9FF", borderRadius:"8px", padding:"10px 20px", fontSize:"14px", background:"transparent", color:"#6B7280", cursor:"pointer" }}>취소</button>
          <button onClick={handleSubmit} style={{ border:"none", borderRadius:"8px", padding:"10px 24px", fontSize:"14px", fontWeight:"500", background:"#4F8EF7", color:"#fff", cursor:"pointer" }}>저장하기</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding:"24px" }}>
      {selectedStore && (
        <StoreDetailModal store={selectedStore} onClose={() => setSelectedStore(null)} onDelete={(id: number) => { handleDelete(id); setSelectedStore(null) }} />
      )}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <div style={{ fontSize:"18px", fontWeight:"700", color:"#1A1F36" }}>매장 관리</div>
          <div style={{ fontSize:"12px", color:"#9CA3AF", marginTop:"2px" }}>버닝 매장 및 영업중 매장을 관리합니다</div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="매장명 검색"
            style={{ padding:"8px 12px", border:"1px solid #E5E9FF", borderRadius:"8px", fontSize:"13px", outline:"none", width:"180px" }} />
          <button onClick={() => setShowForm(true)}
            style={{ padding:"8px 16px", background:"#4A6CF7", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>
            + 매장 추가
          </button>
        </div>
      </div>
      {loading ? <div style={{ textAlign:"center", padding:"40px", color:"#9CA3AF" }}>로딩 중...</div> : <>
        <StoreTable title="버닝 매장 (계약 중)" stores={burning} onDelete={handleDelete} onSelect={setSelectedStore} />
        <StoreTable title="버닝 매장 (계약 만료)" stores={expired} onDelete={handleDelete} onSelect={setSelectedStore} />
        <StoreTable title="영업중 매장" stores={prospect} onDelete={handleDelete} onStatusChange={handleStatusChange} onSelect={setSelectedStore} showProspect={true} />
      </>}
    </div>
  )
}
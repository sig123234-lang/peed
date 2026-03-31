"use client"
import { useEffect, useState } from "react"

// ── 타입 ──────────────────────────────────────────
type BurningHistory = {
  id: number
  start: string
  weeks: number
  fee: number
  reviews: number
  totalAmount: number
  status: "진행중" | "완료"
}

type Store = {
  id: number
  name: string
  category: string
  area: string
  address: string
  storeType: "burning" | "ended" | "prospect"
  pb: number
  monthlyFee: number
  contractStart: string | null
  contractWeeks: number | null
  naverUrl: string | null
  contactName: string | null
  contactPhone: string | null
  memo: string | null
  possibility: "green" | "red" | null
  smsSentCount: number
  active: boolean
  history: BurningHistory[]
  contacts: { text: string; date: string; type: string }[]
  createdAt: string
}

// ── 디자인 토큰 ────────────────────────────────────
const S = {
  bg: "#F5F7FF", surface: "#FFFFFF", surface2: "#F8F9FF",
  border: "1px solid #E5E9FF",
  border2: "1px solid #D4DCFF",
  text: "#1A1F36", text2: "#6B7280", text3: "#9CA3AF",
  accent: "#7C6EF5", accentBg: "rgba(124,110,245,0.12)",
  green: "#23D18B", greenBg: "rgba(35,209,139,0.12)",
  red: "#F4645F", redBg: "rgba(244,100,95,0.12)",
  amber: "#E8A838", amberBg: "rgba(232,168,56,0.12)",
  blue: "#58A6FF", blueBg: "rgba(88,166,255,0.12)",
  radius: "10px", radiusLg: "14px",
}

// ── 헬퍼 ───────────────────────────────────────────
function daysLeft(start: string, weeks: number): number {
  const end = new Date(start)
  end.setDate(end.getDate() + weeks * 7)
  return Math.ceil((end.getTime() - Date.now()) / 86400000)
}

function fmtMoney(n: number) {
  return n >= 10000 ? `${Math.round(n / 10000)}만원` : `${n.toLocaleString()}원`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" })
}

function getAreaFromAddress(addr: string): string {
  const m = addr.match(/([가-힣]+구|[가-힣]+시 [가-힣]+구|[가-힣]+시 [가-힣]+동구|[가-힣]+시 [가-힣]+서구)/)
  return m ? m[1] : addr.split(" ")[0] || "-"
}

// ── 컴포넌트 ───────────────────────────────────────
const inp: React.CSSProperties = {
  padding: "7px 10px", borderRadius: "8px", border: "1px solid #D4DCFF",
  background: S.surface2, color: S.text, fontSize: "12px", outline: "none", width: "100%",
  fontFamily: "inherit",
}

const btn = (color: string, bg: string): React.CSSProperties => ({
  padding: "8px 14px", borderRadius: "8px", border: `0.5px solid ${color}`,
  background: bg, color, fontSize: "12px", fontWeight: 600, cursor: "pointer",
})

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [globalSearch, setGlobalSearch] = useState("")
  const [searchB, setSearchB] = useState("")
  const [searchE, setSearchE] = useState("")
  const [searchP, setSearchP] = useState("")
  const [showB, setShowB] = useState(10)
  const [showE, setShowE] = useState(10)
  const [showP, setShowP] = useState(10)
  const [areaAll, setAreaAll] = useState(false)
  const [sel, setSel] = useState<Store | null>(null)
  const [page, setPage] = useState<"main" | "detail" | "sms" | "confirm">("main")
  const [smsType, setSmsType] = useState<"inquiry" | "cancel">("inquiry")
  const [confirmTarget, setConfirmTarget] = useState<{ start: string; weeks: number; fee: number; pb: number } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: "", category: "", address: "", contactName: "", contactPhone: "", naverUrl: "", storeType: "prospect" as "burning" | "prospect", memo: "" })
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    fetch("/api/admin/stores")
      .then(r => r.json())
      .then(d => setStores(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  // ── 필터 ──────────────────────────────────────────
  const gq = globalSearch.toLowerCase()
  const filt = (list: Store[], q: string) => {
    const lq = (gq || q).toLowerCase()
    if (!lq) return list
    return list.filter(s =>
      s.name.toLowerCase().includes(lq) ||
      s.category.toLowerCase().includes(lq) ||
      s.area.toLowerCase().includes(lq)
    )
  }

  const burning = filt(stores.filter(s => s.storeType === "burning"), searchB)
    .sort((a, b) => {
      const da = a.contractStart ? daysLeft(a.contractStart, a.contractWeeks ?? 4) : 9999
      const db = b.contractStart ? daysLeft(b.contractStart, b.contractWeeks ?? 4) : 9999
      return da - db
    })
  const ended = filt(stores.filter(s => s.storeType === "ended"), searchE)
  const prospect = filt(stores.filter(s => s.storeType === "prospect"), searchP)

  // ── 지역 랭킹 ──────────────────────────────────────
  const areaMap: Record<string, { count: number; fee: number }> = {}
  stores.filter(s => s.storeType !== "prospect").forEach(s => {
    const a = s.area || getAreaFromAddress(s.address)
    if (!areaMap[a]) areaMap[a] = { count: 0, fee: 0 }
    areaMap[a].count++
    areaMap[a].fee += s.history?.reduce((sum, h) => sum + h.fee, 0) ?? 0
  })
  const areaRank = Object.entries(areaMap).sort((a, b) => b[1].count - a[1].count)
  const areaList = areaAll ? areaRank : areaRank.slice(0, 5)
  const areaMax = areaRank[0]?.[1].count || 1

  // ── KPI ────────────────────────────────────────────
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const monthFee = stores.flatMap(s => s.history ?? []).filter(h => h.start.startsWith(thisMonth)).reduce((a, h) => a + h.fee, 0)

  // ── API 액션 ──────────────────────────────────────
  const setPoss = async (id: number, val: "green" | "red" | null) => {
    await fetch("/api/admin/stores", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, possibility: val }) })
    setStores(prev => prev.map(s => s.id === id ? { ...s, possibility: val } : s))
    if (sel?.id === id) setSel(prev => prev ? { ...prev, possibility: val } : prev)
  }

  const doBurning = async (storeId: number, data: { start: string; weeks: number; fee: number; pb: number }) => {
    const res = await fetch("/api/admin/stores/burning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeId, ...data }) })
    if (!res.ok) return showToast("버닝 등록 실패")
    const updated = await fetch("/api/admin/stores").then(r => r.json())
    setStores(Array.isArray(updated) ? updated : [])
    setPage("main"); setConfirmTarget(null)
    showToast("버닝 등록 완료!")
  }

  const markSmsSent = async (storeId: number, type: "inquiry" | "cancel") => {
    await fetch("/api/admin/stores/sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeId, type }) })
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, smsSentCount: (s.smsSentCount || 0) + 1 } : s))
    setPage("detail"); showToast("발송 완료로 기록됐어요")
  }

  const saveNote = async (storeId: number, text: string) => {
    await fetch("/api/admin/stores/note", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeId, text }) })
    const updated = await fetch("/api/admin/stores").then(r => r.json())
    setStores(Array.isArray(updated) ? updated : [])
    const fresh = (updated as Store[]).find(s => s.id === storeId)
    if (fresh) setSel(fresh)
  }

  // ── 행 렌더 ───────────────────────────────────────
  const StoreRow = ({ s }: { s: Store }) => {
    const dl = s.contractStart ? daysLeft(s.contractStart, s.contractWeeks ?? 4) : null
    const urg = dl !== null && dl >= 0 && dl <= 6
    const warn = dl !== null && dl > 6 && dl <= 13
    const cur = s.history?.find(h => h.status === "진행중")
    const totalFee = s.history?.reduce((a, h) => a + h.fee, 0) ?? 0
    const totalAmt = s.history?.reduce((a, h) => a + (h.totalAmount ?? 0), 0) ?? 0

    return (
      <div onClick={() => { setSel(s); setPage("detail") }}
        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", border: urg ? `2px solid ${S.red}` : warn ? `2px solid ${S.amber}` : S.border, background: s.storeType === "ended" ? "rgba(255,255,255,0.02)" : S.surface, marginBottom: "6px", cursor: "pointer", opacity: s.storeType === "ended" ? 0.65 : 1, transition: "background 0.12s" }}
        onMouseEnter={e => (e.currentTarget.style.background = S.surface2)}
        onMouseLeave={e => (e.currentTarget.style.background = s.storeType === "ended" ? "rgba(255,255,255,0.02)" : S.surface)}
      >
        {/* 이모지/이니셜 */}
        <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: S.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", flexShrink: 0 }}>
          {s.name[0]}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: S.text }}>{s.name}</span>
            {urg && <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: "20px", background: S.redBg, color: S.red }}>D-{dl}</span>}
            {warn && !urg && <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: "20px", background: S.amberBg, color: S.amber }}>D-{dl}</span>}
            {s.storeType === "ended" && <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: "20px", background: S.surface2, color: S.text3 }}>종료</span>}
            {s.smsSentCount > 0 && <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "20px", background: S.greenBg, color: S.green }}>문자 {s.smsSentCount}회</span>}
          </div>
          <div style={{ fontSize: "11px", color: S.text3 }}>
            {s.category} · {s.area}
            {s.storeType !== "prospect" && ` · ${s.history?.length ?? 0}회 · 수입 ${totalFee}만원 · 매출기여 ${fmtMoney(totalAmt)}`}
          </div>
          {cur && dl !== null && (
            <div style={{ height: "2px", background: S.surface2, borderRadius: "1px", overflow: "hidden", marginTop: "4px" }}>
              <div style={{ height: "100%", width: `${Math.max(3, Math.min(100, 100 - dl / ((s.contractWeeks ?? 4) * 7) * 100))}%`, background: urg ? S.red : warn ? S.amber : S.blue, borderRadius: "1px" }} />
            </div>
          )}
        </div>

        {/* 오른쪽: PB / 가능성 점 */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {s.storeType === "prospect" && (
            <div style={{ display: "flex", gap: "5px" }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setPoss(s.id, s.possibility === "green" ? null : "green")}
                style={{ width: "18px", height: "18px", borderRadius: "50%", border: "none", cursor: "pointer", background: s.possibility === "green" ? "#22c55e" : "rgba(34,197,94,0.25)", opacity: s.possibility === "green" ? 1 : 0.5, transition: "all .15s" }} />
              <button onClick={() => setPoss(s.id, s.possibility === "red" ? null : "red")}
                style={{ width: "18px", height: "18px", borderRadius: "50%", border: "none", cursor: "pointer", background: s.possibility === "red" ? "#ef4444" : "rgba(239,68,68,0.25)", opacity: s.possibility === "red" ? 1 : 0.5, transition: "all .15s" }} />
            </div>
          )}
          {s.storeType === "burning" && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: S.blue }}>{cur ? cur.fee : 0}만원</div>
              <div style={{ fontSize: "10px", color: S.text3, marginTop: "1px" }}>{dl !== null && dl >= 0 ? `D-${dl}` : "만료"}</div>
            </div>
          )}
          {s.storeType === "ended" && <div style={{ fontSize: "12px", color: S.text3 }}>{s.history?.length ?? 0}회</div>}
        </div>
      </div>
    )
  }

  // ── 섹션 렌더 ─────────────────────────────────────
  const Section = ({
    title, list, search, setSearch, show, setShow, searchId,
  }: {
    title: string; list: Store[]; search: string; setSearch: (v: string) => void
    show: number; setShow: (v: number) => void; searchId: string
  }) => (
    <div style={{ marginBottom: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: S.text }}>{title}</span>
          <span style={{ fontSize: "12px", color: S.text3 }}>({list.length}개)</span>
        </div>
        <input id={searchId} value={search} onChange={e => setSearch(e.target.value)} placeholder="검색..."
          style={{ ...inp, width: "150px" }} />
      </div>
      {list.length === 0
        ? <div style={{ textAlign: "center", padding: "20px", fontSize: "13px", color: S.text3 }}>없어요</div>
        : list.slice(0, show).map(s => <StoreRow key={s.id} s={s} />)}
      {list.length > show && (
        <button onClick={() => setShow(show + 10)}
          style={{ width: "100%", padding: "9px", fontSize: "12px", color: S.text2, background: S.surface2, border: S.border, borderRadius: "8px", cursor: "pointer", marginTop: "2px" }}>
          더 보기 ({list.length - show}개 남음)
        </button>
      )}
    </div>
  )

  // ── 버닝 폼 ───────────────────────────────────────
  const BurningForm = ({ s }: { s: Store }) => {
    const [start, setStart] = useState(new Date().toISOString().split("T")[0])
    const [weeks, setWeeks] = useState(4)
    const [fee, setFee] = useState(10)
    const [pb, setPb] = useState(10)
    const isRe = (s.history?.length ?? 0) > 0

    return (
      <div style={{ background: S.amberBg, border: `0.5px solid ${S.amber}33`, borderRadius: S.radiusLg, padding: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: S.amber, marginBottom: "12px" }}>
          🔥 {isRe ? `재버닝 등록 (${(s.history?.length ?? 0) + 1}회차)` : "버닝 매장으로 등록"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
          <div>
            <label style={{ fontSize: "10px", color: S.text3, marginBottom: "3px", display: "block" }}>계약 시작일</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: "10px", color: S.text3, marginBottom: "3px", display: "block" }}>기간</label>
            <select value={weeks} onChange={e => setWeeks(Number(e.target.value))} style={inp}>
              {[1,2,3,4,6,8,12].map(w => <option key={w} value={w}>{w}주</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
          <div>
            <label style={{ fontSize: "10px", color: S.text3, marginBottom: "3px", display: "block" }}>계약금 (만원)</label>
            <input type="number" value={fee} onChange={e => setFee(Number(e.target.value))} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: "10px", color: S.text3, marginBottom: "3px", display: "block" }}>PB (기본 10)</label>
            <input type="number" value={pb} onChange={e => setPb(Number(e.target.value))} style={inp} />
          </div>
        </div>
        <button onClick={() => {
          if (!start) return alert("계약 시작일을 입력해주세요")
          setConfirmTarget({ start, weeks, fee, pb })
          setPage("confirm")
        }} style={{ width: "100%", padding: "11px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.amber}`, background: S.amberBg, color: S.amber, cursor: "pointer" }}>
          {isRe ? `${(s.history?.length ?? 0) + 1}회차 재버닝 등록하기` : "버닝 매장으로 등록하기"}
        </button>
      </div>
    )
  }

  // ── 상세 페이지 ───────────────────────────────────
  const DetailPage = ({ s }: { s: Store }) => {
    const [noteText, setNoteText] = useState("")
    const dl = s.contractStart ? daysLeft(s.contractStart, s.contractWeeks ?? 4) : null
    const totalFee = s.history?.reduce((a, h) => a + h.fee, 0) ?? 0
    const totalReviews = s.history?.reduce((a, h) => a + h.reviews, 0) ?? 0
    const totalAmt = s.history?.reduce((a, h) => a + (h.totalAmount ?? 0), 0) ?? 0
    const canBurn = s.storeType === "prospect" || s.storeType === "ended"

    return (
      <div>
        {/* 프로필 헤더 */}
        <div style={{ background: S.surface2, borderRadius: S.radiusLg, padding: "18px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: S.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 600, color: S.accent, flexShrink: 0 }}>
            {s.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "18px", fontWeight: 600, color: S.text, marginBottom: "2px" }}>{s.name}</div>
            <div style={{ fontSize: "13px", color: S.text2, marginBottom: "3px" }}>{s.category} · {s.area}</div>
            <div style={{ fontSize: "12px", color: S.text3 }}>{s.address}</div>
          </div>
          <span style={{ fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "20px", background: s.storeType === "burning" ? S.amberBg : s.storeType === "ended" ? S.surface2 : S.greenBg, color: s.storeType === "burning" ? S.amber : s.storeType === "ended" ? S.text3 : S.green, flexShrink: 0 }}>
            {s.storeType === "burning" ? "🔥 버닝" : s.storeType === "ended" ? "⛔ 종료" : "🏪 영업중"}
          </span>
        </div>

        {/* 총계 스트립 */}
        {(s.history?.length ?? 0) > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "14px" }}>
            {[
              { label: "계약금 수입", value: `${totalFee}만원`, color: S.green },
              { label: "총 리뷰", value: `${totalReviews}건`, color: S.blue },
              { label: "매출 기여", value: fmtMoney(totalAmt), color: S.accent },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: S.surface2, borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: S.text3, marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
                <div style={{ fontSize: "16px", fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* 기본 정보 */}
        <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "14px 16px", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: S.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingBottom: "5px", borderBottom: S.border }}>기본 정보</div>
          {[
            { k: "담당자", v: `${s.contactName || "-"}${s.contactPhone ? " · " + s.contactPhone : ""}` },
            { k: "PB 적립", v: `${s.pb} PB`, c: S.blue },
            ...(s.storeType === "burning" ? [{ k: "계약 잔여", v: dl !== null && dl >= 0 ? `D-${dl}` : "만료됨", c: dl !== null && dl <= 6 ? S.red : dl !== null && dl <= 13 ? S.amber : S.text }] : []),
            ...(s.naverUrl ? [{ k: "네이버", v: "바로가기 →", link: s.naverUrl }] : []),
          ].map(({ k, v, c, link }) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: S.border, fontSize: "13px" }}>
              <span style={{ color: S.text2 }}>{k}</span>
              {link ? <a href={link} target="_blank" rel="noreferrer" style={{ color: S.green, textDecoration: "none", fontWeight: 600 }}>{v}</a>
                : <span style={{ fontWeight: 600, color: c || S.text }}>{v}</span>}
            </div>
          ))}
        </div>

        {/* 문자 버튼 (버닝만) */}
        {s.storeType === "burning" && (
          <button onClick={() => { setSmsType("inquiry"); setPage("sms") }}
            style={{ width: "100%", padding: "10px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.blue}`, background: S.blueBg, color: S.blue, cursor: "pointer", marginBottom: "12px" }}>
            📱 재계약 문자 발송
          </button>
        )}

        {/* 버닝 히스토리 */}
        {(s.history?.length ?? 0) > 0 && (
          <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "14px 16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", color: S.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingBottom: "5px", borderBottom: S.border }}>
              버닝 히스토리 ({s.history?.length}회)
            </div>
            {s.history?.slice().reverse().map((h, i) => {
              const end = new Date(h.start); end.setDate(end.getDate() + h.weeks * 7)
              return (
                <div key={h.id} style={{ background: S.surface2, borderRadius: "8px", padding: "11px", marginBottom: "7px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: S.text }}>{(s.history?.length ?? 0) - i}회차</span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: S.text3 }}>{h.start} ~ {end.toISOString().split("T")[0]}</span>
                      <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "20px", background: h.status === "진행중" ? S.amberBg : S.surface, color: h.status === "진행중" ? S.amber : S.text3 }}>{h.status}</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "5px" }}>
                    {[
                      { l: "계약금", v: `${h.fee}만원`, c: S.green },
                      { l: "기간", v: `${h.weeks}주`, c: S.text },
                      { l: "리뷰", v: `${h.reviews}건`, c: S.text },
                      { l: "매출기여", v: fmtMoney(h.totalAmount), c: S.blue },
                    ].map(({ l, v, c }) => (
                      <div key={l} style={{ background: S.surface, borderRadius: "6px", padding: "6px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: "9px", color: S.text3, marginBottom: "2px", textTransform: "uppercase" }}>{l}</div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 버닝 등록 폼 */}
        {canBurn && <div style={{ marginBottom: "12px" }}><BurningForm s={s} /></div>}

        {/* 연락 이력 */}
        <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "14px 16px", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: S.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingBottom: "5px", borderBottom: S.border }}>연락 이력</div>
          {(s.contacts?.length ?? 0) === 0
            ? <div style={{ fontSize: "13px", color: S.text3, padding: "8px 0" }}>이력 없음</div>
            : s.contacts?.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", padding: "6px 0", borderBottom: S.border, fontSize: "13px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: c.type === "sms" ? S.blueBg : S.surface2, color: c.type === "sms" ? S.blue : S.text3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", flexShrink: 0 }}>
                  {c.type === "sms" ? "문" : "메"}
                </div>
                <div>
                  <div style={{ color: S.text }}>{c.text}</div>
                  <div style={{ fontSize: "11px", color: S.text3, marginTop: "1px" }}>{c.date}</div>
                </div>
              </div>
            ))}
          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
            <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="연락 메모..." style={{ ...inp, flex: 1 }} />
            <button onClick={async () => { if (!noteText.trim()) return; await saveNote(s.id, noteText); setNoteText("") }}
              style={{ padding: "7px 14px", fontSize: "12px", borderRadius: "8px", border: S.border2, background: S.surface2, color: S.text2, cursor: "pointer" }}>추가</button>
          </div>
        </div>
      </div>
    )
  }

  // ── SMS 페이지 ────────────────────────────────────
  const SMSPage = ({ s }: { s: Store }) => {
    const dl = s.contractStart ? daysLeft(s.contractStart, s.contractWeeks ?? 4) : null
    const totalReviews = s.history?.reduce((a, h) => a + h.reviews, 0) ?? 0
    const totalFee = s.history?.reduce((a, h) => a + h.fee, 0) ?? 0
    const totalAmt = s.history?.reduce((a, h) => a + (h.totalAmount ?? 0), 0) ?? 0
    const cur = s.history?.find(h => h.status === "진행중")
    const endDate = cur ? (() => { const e = new Date(cur.start); e.setDate(e.getDate() + cur.weeks * 7); return e.toLocaleDateString("ko-KR") })() : "-"

    const txt = `안녕하세요, ${s.contactName || "사장님"}님 😊\nPEED 운영팀입니다.\n\n${s.name}의 현재 계약이\n${dl !== null && dl >= 0 ? `D-${dl}일 후인 ` : ""}${endDate}에 만료됩니다.\n\n📊 이번 버닝 기간 성과\n• 총 리뷰: ${totalReviews}건 (영수증 1장 = 리뷰 1건)\n• 리뷰 기반 매출 기여: 약 ${fmtMoney(totalAmt)}\n• 계약금 합계 (PEED 수입): ${totalFee}만원\n\n재계약 의향이 있으시면 편하게 연락 주세요 🙏\n감사합니다! PEED 운영팀`

    return (
      <div>
        <div style={{ fontSize: "17px", fontWeight: 600, color: S.text, marginBottom: "4px" }}>재계약 문자</div>
        <div style={{ fontSize: "13px", color: S.text2, marginBottom: "20px" }}>{s.name} · {s.contactName} · {s.contactPhone}</div>
        <div style={{ background: S.surface2, borderRadius: S.radiusLg, padding: "16px", fontSize: "13px", lineHeight: 1.8, whiteSpace: "pre-wrap", color: S.text, marginBottom: "12px" }}>{txt}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button onClick={() => navigator.clipboard.writeText(txt).then(() => showToast("복사됐어요!"))}
            style={{ padding: "11px", fontSize: "13px", borderRadius: "8px", border: S.border2, background: S.surface2, color: S.text2, cursor: "pointer" }}>복사하기</button>
          <button onClick={() => markSmsSent(s.id, smsType)}
            style={{ padding: "11px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.green}`, background: S.greenBg, color: S.green, cursor: "pointer" }}>발송 완료 기록</button>
        </div>
      </div>
    )
  }

  // ── 확인 페이지 ───────────────────────────────────
  const ConfirmPage = ({ s }: { s: Store }) => {
    if (!confirmTarget) return null
    const end = new Date(confirmTarget.start)
    end.setDate(end.getDate() + confirmTarget.weeks * 7)
    const isRe = (s.history?.length ?? 0) > 0
    return (
      <div>
        <div style={{ fontSize: "17px", fontWeight: 600, color: S.text, marginBottom: "4px" }}>{isRe ? `${(s.history?.length ?? 0) + 1}회차 재버닝` : "버닝 등록"}</div>
        <div style={{ fontSize: "13px", color: S.text2, marginBottom: "20px" }}>{s.name}</div>
        <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "14px 16px", marginBottom: "16px" }}>
          {[
            { k: "계약 기간", v: `${confirmTarget.start} ~ ${end.toISOString().split("T")[0]} (${confirmTarget.weeks}주)` },
            { k: "계약금 (수입)", v: `${confirmTarget.fee}만원`, c: S.green },
            { k: "PB 적립", v: `${confirmTarget.pb} PB`, c: S.blue },
          ].map(({ k, v, c }) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: S.border, fontSize: "13px" }}>
              <span style={{ color: S.text2 }}>{k}</span>
              <span style={{ fontWeight: 600, color: c || S.text }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button onClick={() => { setPage("detail"); setConfirmTarget(null) }}
            style={{ padding: "11px", fontSize: "13px", borderRadius: "8px", border: S.border2, background: S.surface2, color: S.text2, cursor: "pointer" }}>취소</button>
          <button onClick={() => doBurning(s.id, confirmTarget)}
            style={{ padding: "11px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.amber}`, background: S.amberBg, color: S.amber, cursor: "pointer" }}>🔥 버닝 등록하기</button>
        </div>
      </div>
    )
  }

  // ── 메인 렌더 ──────────────────────────────────────
  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: S.text3 }}>로딩 중...</div>

  return (
    <div style={{ padding: "24px", background: S.bg, minHeight: "100vh", fontFamily: "inherit" }}>

      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 999, background: S.green, color: "#fff", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600 }}>
          ✓ {toast}
        </div>
      )}

      {/* 매장 추가 모달 */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: S.surface, border: S.border2, borderRadius: S.radiusLg, width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "14px 16px", borderBottom: S.border, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: S.surface, zIndex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: S.text }}>매장 추가</div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", color: S.text2, fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", color: S.text3, display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>유형</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["prospect", "burning"] as const).map(t => (
                    <button key={t} onClick={() => setAddForm(f => ({ ...f, storeType: t }))}
                      style={{ flex: 1, padding: "9px", fontSize: "13px", borderRadius: "8px", border: `0.5px solid ${addForm.storeType === t ? (t === "burning" ? S.amber : S.green) : S.border2.replace("0.5px solid ", "")}`, background: addForm.storeType === t ? (t === "burning" ? S.amberBg : S.greenBg) : "transparent", color: addForm.storeType === t ? (t === "burning" ? S.amber : S.green) : S.text2, cursor: "pointer", fontWeight: addForm.storeType === t ? 600 : 400 }}>
                      {t === "burning" ? "🔥 버닝" : "🏪 영업중"}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { label: "매장명 *", key: "name", placeholder: "매장 이름" },
                { label: "카테고리", key: "category", placeholder: "한식, 카페, 이자카야 등" },
                { label: "주소", key: "address", placeholder: "서울 마포구..." },
                { label: "담당자 이름", key: "contactName", placeholder: "홍길동" },
                { label: "담당자 연락처", key: "contactPhone", placeholder: "010-0000-0000" },
                { label: "네이버 플레이스 URL", key: "naverUrl", placeholder: "https://..." },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "11px", color: S.text3, display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</label>
                  <input value={(addForm as any)[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: S.border2, background: S.surface2, color: S.text, fontSize: "13px", outline: "none", fontFamily: "inherit" }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: "11px", color: S.text3, display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>내부 메모</label>
                <textarea value={addForm.memo} onChange={e => setAddForm(f => ({ ...f, memo: e.target.value }))}
                  placeholder="내부 메모..."
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: S.border2, background: S.surface2, color: S.text, fontSize: "13px", outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: "60px" }} />
              </div>
            </div>
            <div style={{ padding: "12px 16px", borderTop: S.border, display: "flex", gap: "8px" }}>
              <button onClick={() => setShowAddModal(false)}
                style={{ flex: 1, padding: "10px", fontSize: "13px", borderRadius: "8px", border: S.border2, background: S.surface2, color: S.text2, cursor: "pointer" }}>취소</button>
              <button onClick={async () => {
                if (!addForm.name.trim()) return alert("매장명을 입력해주세요")
                const res = await fetch("/api/admin/stores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) })
                if (!res.ok) return alert("저장 실패")
                const updated = await fetch("/api/admin/stores").then(r => r.json())
                setStores(Array.isArray(updated) ? updated : [])
                setShowAddModal(false)
                setAddForm({ name: "", category: "", address: "", contactName: "", contactPhone: "", naverUrl: "", storeType: "prospect", memo: "" })
                showToast("매장이 추가됐어요!")
              }}
                style={{ flex: 2, padding: "10px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.accent}`, background: S.accentBg, color: S.accent, cursor: "pointer" }}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 뒤로가기 */}
      {page !== "main" && (
        <button onClick={() => {
          if (page === "confirm" || page === "sms") setPage("detail")
          else { setPage("main"); setSel(null) }
        }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: S.text2, cursor: "pointer", marginBottom: "20px", padding: "6px 10px", borderRadius: "8px", border: S.border, background: S.surface, width: "fit-content" }}>
          ← {page === "confirm" || page === "sms" ? `${sel?.name}` : "매장 목록"}
        </button>
      )}

      {/* ── 메인 ── */}
      {page === "main" && (
        <>
          {/* 페이지 헤더 */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: S.text }}>매장 관리</div>
              <div style={{ fontSize: "12px", color: S.text3, marginTop: "3px" }}>
                버닝 매장 계약 관리, 종료 매장 이력, 영업중 매장 영업 현황을 한눈에 확인하세요
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ padding: "8px 16px", borderRadius: "8px", border: `0.5px solid ${S.accent}`, background: S.accentBg, color: S.accent, fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              + 매장 추가
            </button>
          </div>

          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "20px" }}>
            {[
              { label: "🔥 버닝", value: `${stores.filter(s => s.storeType === "burning").length}개` },
              { label: "⛔ 종료", value: `${stores.filter(s => s.storeType === "ended").length}개` },
              { label: "🏪 영업중", value: `${stores.filter(s => s.storeType === "prospect").length}개` },
              { label: "💰 이번달 수입", value: `${monthFee}만원`, color: S.green },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: S.surface2, borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ fontSize: "12px", color: S.text3, marginBottom: "6px" }}>{label}</div>
                <div style={{ fontSize: "22px", fontWeight: 600, color: color || S.text }}>{value}</div>
              </div>
            ))}
          </div>

          {/* 지역 TOP5 */}
          <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: S.text }}>지역별 거래 TOP 5</div>
              <button onClick={() => setAreaAll(v => !v)} style={{ fontSize: "12px", color: S.text2, background: "none", border: "none", cursor: "pointer" }}>
                {areaAll ? "접기" : "전체 보기"}
              </button>
            </div>
            {areaList.map(([area, d], i) => {
              const pals = ["#7F77DD", "#1D9E75", "#D85A30", "#378ADD", "#BA7517"]
              return (
                <div key={area} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", borderBottom: S.border }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, minWidth: "90px", color: S.text }}>{i + 1}. {area}</div>
                  <div style={{ flex: 1, height: "4px", background: S.surface2, borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round(d.count / areaMax * 100)}%`, background: pals[i % pals.length], borderRadius: "2px" }} />
                  </div>
                  <div style={{ fontSize: "11px", color: S.text3, minWidth: "80px", textAlign: "right" }}>{d.count}개 · {d.fee}만원</div>
                </div>
              )
            })}
          </div>

          {/* 전체 검색 */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="전체 매장 검색..."
              style={{ ...inp, flex: 1, fontSize: "13px", padding: "8px 12px" }} />
            {globalSearch && <button onClick={() => setGlobalSearch("")} style={{ fontSize: "12px", color: S.text3, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>초기화</button>}
          </div>

          {/* 3섹션 */}
          <Section title="🔥 버닝 매장" list={burning} search={searchB} setSearch={setSearchB} show={showB} setShow={setShowB} searchId="sb" />
          <Section title="⛔ 종료 매장" list={ended} search={searchE} setSearch={setSearchE} show={showE} setShow={setShowE} searchId="se" />
          <Section title="🏪 영업중 매장" list={prospect} search={searchP} setSearch={setSearchP} show={showP} setShow={setShowP} searchId="sp" />
        </>
      )}

      {/* ── 상세 ── */}
      {page === "detail" && sel && <DetailPage s={sel} />}

      {/* ── SMS ── */}
      {page === "sms" && sel && <SMSPage s={sel} />}

      {/* ── 확인 ── */}
      {page === "confirm" && sel && <ConfirmPage s={sel} />}

    </div>
  )
}


"use client"
import { useEffect, useState } from "react"

// ── 타입 ──────────────────────────────────────────
type Review = {
  id: string
  storeName: string
  platform: string
  menu: string | null
  amount: number | null
  createdAt: string
}

type Winner = {
  id: number
  name: string | null
  phone: string | null
  uniqueCode: string | null
  prizeId: string
  prizeName: string
  prizeEmoji: string
  prizeValue: string
  drawId: string
  drawRound: number
  drawDate: string
  received: boolean
  receivedDate: string | null
  notified: boolean
  notifiedDate: string | null
  usedPb: number
  holdingPb: number
  reviewCount: number
  reviews: Review[]
}

type Prize = {
  id: string
  name: string
  emoji: string
  value: string
  stock: number
}

type Draw = {
  id: string
  round: number
  date: string
  prizeId: string
  prizeName: string
  prizeEmoji: string
  prizeValue: string
  winnerCount: number
  totalSlots: number
  status: "완료" | "upcoming"
}

// ── 디자인 토큰 ───────────────────────────────────
const S = {
  bg: "#0A0A0F", surface: "#111118", surface2: "#16161F",
  border: "0.5px solid rgba(255,255,255,0.06)",
  border2: "0.5px solid rgba(255,255,255,0.1)",
  text: "#F0EFF8", text2: "#9896B0", text3: "#5C5A72",
  accent: "#7C6EF5", accentBg: "rgba(124,110,245,0.12)",
  green: "#23D18B", greenBg: "rgba(35,209,139,0.12)",
  red: "#F4645F", redBg: "rgba(244,100,95,0.12)",
  amber: "#E8A838", amberBg: "rgba(232,168,56,0.12)",
  blue: "#58A6FF", blueBg: "rgba(88,166,255,0.12)",
  radius: "10px", radiusLg: "14px",
}

const PLATFORM_COLOR: Record<string, { bg: string; color: string }> = {
  naver:   { bg: "rgba(3,199,90,0.15)",   color: "#03C75A" },
  kakao:   { bg: "rgba(254,229,0,0.15)",   color: "#B8860B" },
  google:  { bg: "rgba(88,166,255,0.15)",  color: "#58A6FF" },
  baemin:  { bg: "rgba(0,188,172,0.15)",   color: "#00BCAC" },
  coupang: { bg: "rgba(255,87,34,0.15)",   color: "#FF5722" },
}
const plStyle = (p: string) => PLATFORM_COLOR[p?.toLowerCase()] ?? { bg: S.surface2, color: S.text3 }

const inp: React.CSSProperties = {
  padding: "7px 10px", borderRadius: "8px",
  border: "0.5px solid rgba(255,255,255,0.1)",
  background: S.surface2, color: S.text, fontSize: "12px",
  outline: "none", width: "100%", fontFamily: "inherit",
}

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"winners" | "prizes" | "draws" | "unreceived">("winners")
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "received" | "unreceived">("all")
  const [filterPrize, setFilterPrize] = useState("all")
  const [showCount, setShowCount] = useState(15)
  const [sel, setSel] = useState<Winner | null>(null)
  const [page, setPage] = useState<"main" | "detail" | "notify">("main")
  const [notifyTarget, setNotifyTarget] = useState<Winner | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch("/api/admin/winners").then(r => r.json()),
      fetch("/api/admin/prizes").then(r => r.json()),
      fetch("/api/admin/draws").then(r => r.json()),
    ]).then(([w, p, d]) => {
      setWinners(Array.isArray(w) ? w : [])
      setPrizes(Array.isArray(p) ? p : [])
      setDraws(Array.isArray(d) ? d : [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // ── API ───────────────────────────────────────────
  const markReceived = async (id: number) => {
    await fetch("/api/admin/winners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId: id, action: "received" }),
    })
    setWinners(prev => prev.map(w =>
      w.id === id ? { ...w, received: true, receivedDate: new Date().toISOString().split("T")[0] } : w
    ))
    if (sel?.id === id) setSel(prev => prev ? { ...prev, received: true, receivedDate: new Date().toISOString().split("T")[0] } : prev)
    showToast("수령 완료 처리됐어요")
  }

  const markNotified = async (id: number) => {
    await fetch("/api/admin/winners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId: id, action: "notified" }),
    })
    setWinners(prev => prev.map(w =>
      w.id === id ? { ...w, notified: true, notifiedDate: new Date().toISOString().split("T")[0] } : w
    ))
    showToast("발송 완료로 기록됐어요")
    setPage("main")
  }

  const markBulkNotified = async () => {
    const targets = winners.filter(w => !w.received && !w.notified)
    await Promise.all(targets.map(w =>
      fetch("/api/admin/winners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: w.id, action: "notified" }),
      })
    ))
    setWinners(prev => prev.map(w =>
      !w.received && !w.notified
        ? { ...w, notified: true, notifiedDate: new Date().toISOString().split("T")[0] }
        : w
    ))
    showToast(`${targets.length}명 알림 처리 완료!`)
    setBulkMode(false)
  }

  // ── KPI ───────────────────────────────────────────
  const total = winners.length
  const received = winners.filter(w => w.received).length
  const unreceived = total - received
  const upcoming = draws.find(d => d.status === "upcoming")
  const daysLeft = upcoming
    ? Math.ceil((new Date(upcoming.date).getTime() - Date.now()) / 86400000)
    : null

  // ── 필터 ──────────────────────────────────────────
  const filtered = winners.filter(w => {
    const q = search.toLowerCase()
    if (q && !(w.name || "").toLowerCase().includes(q) && !(w.phone || "").includes(q)) return false
    if (filterStatus === "received" && !w.received) return false
    if (filterStatus === "unreceived" && w.received) return false
    if (filterPrize !== "all" && w.prizeId !== filterPrize) return false
    return true
  }).sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())

  // ── 알림 문자 ─────────────────────────────────────
  const getNotifyText = (w: Winner) =>
    `안녕하세요, ${w.name || "고객"}님! 🎉\nPEED 운영팀입니다.\n\n축하드립니다!\n${w.drawRound}회차 추첨에서 당첨되셨습니다.\n\n🎁 당첨 경품: ${w.prizeEmoji} ${w.prizeName}\n   (${w.prizeValue})\n\n📊 회원님의 리뷰 활동\n• 총 리뷰 수: ${w.reviewCount}건\n• 총 결제금액: ${Math.round(w.reviews.reduce((a, r) => a + (r.amount ?? 0), 0) / 10000)}만원\n\n경품 수령을 위해\n고객센터로 연락 주시면 감사하겠습니다.\n\n수령 기한이 지나면 당첨이 취소될 수 있으니\n빠른 연락 부탁드려요 😊\n\n감사합니다!\nPEED 운영팀`

  // ── 당첨자 행 ─────────────────────────────────────
  const WinnerRow = ({ w }: { w: Winner }) => {
    const daysSince = Math.floor((Date.now() - new Date(w.drawDate).getTime()) / 86400000)
    const isOld = !w.received && daysSince >= 7
    return (
      <div onClick={() => { setSel(w); setPage("detail") }}
        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "8px", border: isOld ? `0.5px solid ${S.red}44` : S.border, background: isOld ? `rgba(244,100,95,0.04)` : S.surface, marginBottom: "6px", cursor: "pointer", transition: "background .12s", borderLeft: !w.received ? `2px solid ${isOld ? S.red : S.amber}` : undefined }}
        onMouseEnter={e => (e.currentTarget.style.background = S.surface2)}
        onMouseLeave={e => (e.currentTarget.style.background = isOld ? `rgba(244,100,95,0.04)` : S.surface)}
      >
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: S.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600, color: S.accent, flexShrink: 0 }}>
          {(w.name || "?")[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: S.text }}>{w.name || "이름 없음"}</span>
            {w.uniqueCode && <span style={{ fontFamily: "monospace", fontSize: "10px", color: S.text3 }}>{w.uniqueCode}</span>}
            <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: "20px", background: w.received ? S.greenBg : S.redBg, color: w.received ? S.green : S.red }}>
              {w.received ? "수령완료" : "미수령"}
            </span>
            {w.notified && <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "20px", background: S.blueBg, color: S.blue }}>알림발송</span>}
          </div>
          <div style={{ fontSize: "12px", color: S.text3 }}>
            {w.prizeEmoji} {w.prizeName} · {w.drawRound}회차 · {w.drawDate} · 리뷰 {w.reviewCount}건
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "12px", color: S.text2 }}>{w.phone}</div>
          <div style={{ fontSize: "11px", color: S.text3, marginTop: "2px" }}>
            {w.received ? `수령 ${w.receivedDate}` : `${daysSince}일 경과`}
          </div>
        </div>
      </div>
    )
  }

  // ── 상세 페이지 ───────────────────────────────────
  const DetailPage = ({ w }: { w: Winner }) => {
    const daysSince = Math.floor((Date.now() - new Date(w.drawDate).getTime()) / 86400000)
    const totalAmt = w.reviews.reduce((a, rv) => a + (rv.amount ?? 0), 0)
    const platformCounts: Record<string, number> = {}
    w.reviews.forEach(rv => { platformCounts[rv.platform] = (platformCounts[rv.platform] || 0) + 1 })
    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]

    return (
      <div>
        {/* 프로필 헤더 */}
        <div style={{ background: S.surface2, borderRadius: S.radiusLg, padding: "18px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: S.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 600, color: S.accent, flexShrink: 0 }}>
            {(w.name || "?")[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "18px", fontWeight: 600, color: S.text, marginBottom: "2px" }}>{w.name || "이름 없음"}</div>
            <div style={{ fontSize: "13px", color: S.text2, marginBottom: "4px" }}>{w.phone}{w.uniqueCode ? ` · ${w.uniqueCode}` : ""}</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: w.received ? S.greenBg : S.redBg, color: w.received ? S.green : S.red }}>
                {w.received ? "수령완료" : "미수령"}
              </span>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: S.surface2, color: S.text3 }}>
                {w.drawRound}회차 당첨
              </span>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: S.amberBg, color: S.amber }}>
                {w.prizeEmoji} {w.prizeName}
              </span>
            </div>
          </div>
        </div>

        {/* 리뷰 통계 3칸 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "12px" }}>
          {[
            { label: "총 리뷰 수", value: `${w.reviewCount}건`, color: S.accent },
            { label: "총 결제금액", value: `${Math.round(totalAmt / 10000)}만원`, color: S.green },
            { label: "주 플랫폼", value: topPlatform?.[0] || "-", color: S.text },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: S.surface2, borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: S.text3, marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
              <div style={{ fontSize: "16px", fontWeight: 600, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* 당첨 정보 */}
        <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "14px 16px", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: S.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingBottom: "5px", borderBottom: S.border }}>당첨 정보</div>
          {[
            { k: "경품", v: `${w.prizeEmoji} ${w.prizeName} (${w.prizeValue})` },
            { k: "추첨 회차", v: `${w.drawRound}회차 · ${w.drawDate}` },
            { k: "경과일", v: `${daysSince}일`, c: daysSince >= 7 && !w.received ? S.red : S.text },
          ].map(({ k, v, c }) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: S.border, fontSize: "13px" }}>
              <span style={{ color: S.text2 }}>{k}</span>
              <span style={{ fontWeight: 600, color: c || S.text }}>{v}</span>
            </div>
          ))}
          {/* 수령 상태 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: "13px" }}>
            <span style={{ color: S.text2 }}>수령 상태</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: w.received ? S.greenBg : S.redBg, color: w.received ? S.green : S.red }}>
                {w.received ? `수령완료 · ${w.receivedDate}` : "미수령"}
              </span>
              {!w.received && (
                <button onClick={() => markReceived(w.id)}
                  style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", border: `0.5px solid ${S.green}`, background: S.greenBg, color: S.green, cursor: "pointer" }}>
                  수령처리
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 알림 버튼 */}
        {!w.received && (
          <button onClick={() => { setNotifyTarget(w); setPage("notify") }}
            style={{ width: "100%", padding: "10px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.blue}`, background: S.blueBg, color: S.blue, cursor: "pointer", marginBottom: "14px" }}>
            📱 당첨 알림 문자 발송
          </button>
        )}

        {/* 리뷰 내역 — 핵심! */}
        <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "14px 16px" }}>
          <div style={{ fontSize: "10px", color: S.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingBottom: "5px", borderBottom: S.border }}>
            이 유저가 작성한 리뷰 ({w.reviews.length}건)
          </div>
          {w.reviews.length === 0
            ? <div style={{ fontSize: "13px", color: S.text3, padding: "8px 0", textAlign: "center" }}>리뷰 없음</div>
            : w.reviews.map(rv => (
              <div key={rv.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: S.border, fontSize: "13px" }}>
                <span style={{ ...plStyle(rv.platform), fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: plStyle(rv.platform).bg, flexShrink: 0 }}>
                  {rv.platform}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: S.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rv.storeName}</div>
                  <div style={{ fontSize: "11px", color: S.text3 }}>{rv.menu} · {new Date(rv.createdAt).toLocaleDateString("ko-KR")}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, color: S.green }}>{rv.amount ? `${rv.amount.toLocaleString()}원` : "-"}</div>
                  <div style={{ fontSize: "10px", color: S.accent, marginTop: "1px" }}>+1 PB</div>
                </div>
              </div>
            ))}
          {/* 플랫폼 분포 */}
          {w.reviews.length > 0 && (
            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: S.border }}>
              <div style={{ fontSize: "11px", color: S.text3, marginBottom: "6px" }}>플랫폼별</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).map(([pl, cnt]) => (
                  <span key={pl} style={{ ...plStyle(pl), fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: plStyle(pl).bg }}>
                    {pl} {cnt}건
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── 알림 페이지 ───────────────────────────────────
  const NotifyPage = ({ w }: { w: Winner }) => {
    const txt = getNotifyText(w)
    return (
      <div>
        <div style={{ fontSize: "17px", fontWeight: 600, color: S.text, marginBottom: "4px" }}>당첨 알림 발송</div>
        <div style={{ fontSize: "13px", color: S.text2, marginBottom: "20px" }}>{w.name} · {w.phone}</div>
        <div style={{ background: S.surface2, borderRadius: S.radiusLg, padding: "16px", fontSize: "13px", lineHeight: 1.8, whiteSpace: "pre-wrap", color: S.text, marginBottom: "12px" }}>{txt}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button onClick={() => navigator.clipboard.writeText(txt).then(() => showToast("복사됐어요!"))}
            style={{ padding: "11px", fontSize: "13px", borderRadius: "8px", border: S.border2, background: S.surface2, color: S.text2, cursor: "pointer" }}>복사하기</button>
          <button onClick={() => markNotified(w.id)}
            style={{ padding: "11px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.green}`, background: S.greenBg, color: S.green, cursor: "pointer" }}>발송 완료 기록</button>
        </div>
      </div>
    )
  }

  // ── 탭별 콘텐츠 ───────────────────────────────────
  const TabPrizes = () => (
    <div>
      {prizes.map(p => {
        const ws = winners.filter(w => w.prizeId === p.id)
        const recv = ws.filter(w => w.received).length
        const pct = ws.length ? Math.round(recv / ws.length * 100) : 0
        return (
          <div key={p.id} style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "16px", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ fontSize: "26px" }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: S.text }}>{p.name}</div>
                <div style={{ fontSize: "12px", color: S.text3 }}>{p.value} · 재고 {p.stock}개</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "18px", fontWeight: 600, color: S.text }}>{ws.length}명</div>
                <div style={{ fontSize: "11px", color: S.text3 }}>당첨</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
              <span style={{ color: S.text2 }}>수령률</span>
              <span style={{ fontWeight: 600, color: pct === 100 ? S.green : pct < 50 ? S.red : S.amber }}>{recv}/{ws.length}명 ({pct}%)</span>
            </div>
            <div style={{ height: "5px", background: S.surface2, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? S.green : pct < 50 ? S.red : S.amber, borderRadius: "3px" }} />
            </div>
            {ws.length - recv > 0 && (
              <div style={{ fontSize: "12px", color: S.red, marginTop: "8px" }}>미수령 {ws.length - recv}명 — 연락 필요</div>
            )}
          </div>
        )
      })}
      {prizes.length === 0 && <div style={{ textAlign: "center", padding: "32px", fontSize: "13px", color: S.text3 }}>경품 없음</div>}
    </div>
  )

  const TabDraws = () => (
    <div>
      {[...draws].reverse().map(d => {
        const isUp = d.status === "upcoming"
        const dL = isUp ? Math.ceil((new Date(d.date).getTime() - Date.now()) / 86400000) : null
        const ws = winners.filter(w => w.drawId === d.id)
        const recv = ws.filter(w => w.received).length
        return (
          <div key={d.id} style={{ background: isUp ? S.amberBg : S.surface, border: isUp ? `0.5px solid ${S.amber}44` : S.border, borderRadius: S.radiusLg, padding: "16px", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: isUp ? 0 : "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: S.text }}>{d.round}회차 추첨</span>
                  <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: isUp ? S.amberBg : S.greenBg, color: isUp ? S.amber : S.green }}>
                    {isUp ? `D-${dL}` : "완료"}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: S.text2 }}>
                  {d.date} · {d.prizeEmoji} {d.prizeName} · {d.prizeValue}
                </div>
              </div>
            </div>
            {!isUp && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
                {[
                  { label: "당첨", value: d.winnerCount, color: S.text },
                  { label: "수령완료", value: recv, color: S.green },
                  { label: "미수령", value: d.winnerCount - recv, color: d.winnerCount - recv > 0 ? S.red : S.green },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: S.surface2, borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: S.text3, marginBottom: "2px", textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color }}>{value}명</div>
                  </div>
                ))}
              </div>
            )}
            {isUp && (
              <div style={{ background: S.surface2, borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: S.text2, marginTop: "10px" }}>
                당첨자 {d.totalSlots}명 · 날짜 도래 시 자동 추첨
              </div>
            )}
          </div>
        )
      })}
      {draws.length === 0 && <div style={{ textAlign: "center", padding: "32px", fontSize: "13px", color: S.text3 }}>추첨 내역 없음</div>}
    </div>
  )

  const TabUnreceived = () => {
    const list = winners.filter(w => !w.received).sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime())
    if (list.length === 0) return <div style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: S.text3 }}>미수령 당첨자가 없어요 🎉</div>
    return (
      <div>
        <div style={{ background: S.redBg, border: `0.5px solid ${S.red}33`, borderRadius: S.radiusLg, padding: "12px 14px", marginBottom: "14px", fontSize: "13px", color: S.red }}>
          미수령 당첨자에게 알림을 발송해 수령을 독려해요. 7일 이상 경과 시 상단 강조 표시돼요.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: S.text }}>미수령 {list.length}명</div>
          <button onClick={() => { setBulkMode(true); markBulkNotified() }}
            style={{ padding: "7px 14px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.red}`, background: S.redBg, color: S.red, cursor: "pointer" }}>
            전체 알림 처리
          </button>
        </div>
        {list.map(w => {
          const daysSince = Math.floor((Date.now() - new Date(w.drawDate).getTime()) / 86400000)
          const isOld = daysSince >= 7
          return (
            <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", border: isOld ? `0.5px solid ${S.red}44` : S.border, background: isOld ? `rgba(244,100,95,0.06)` : S.surface, marginBottom: "6px" }}>
              <div onClick={() => { setSel(w); setPage("detail") }} style={{ width: "32px", height: "32px", borderRadius: "50%", background: S.redBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600, color: S.red, flexShrink: 0, cursor: "pointer" }}>
                {(w.name || "?")[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => { setSel(w); setPage("detail") }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: S.text }}>{w.name}</span>
                  {isOld && <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: "20px", background: S.redBg, color: S.red }}>{daysSince}일 경과</span>}
                  {w.notified && <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "20px", background: S.surface2, color: S.text3 }}>알림발송됨</span>}
                </div>
                <div style={{ fontSize: "12px", color: S.text3 }}>{w.prizeEmoji} {w.prizeName} · {w.drawRound}회차 · {w.phone} · 리뷰 {w.reviewCount}건</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0 }}>
                <button onClick={() => { setNotifyTarget(w); setPage("notify") }}
                  style={{ padding: "5px 10px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", border: `0.5px solid ${S.blue}`, background: S.blueBg, color: S.blue, cursor: "pointer", whiteSpace: "nowrap" }}>알림 발송</button>
                <button onClick={() => markReceived(w.id)}
                  style={{ padding: "5px 10px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", border: `0.5px solid ${S.green}`, background: S.greenBg, color: S.green, cursor: "pointer", whiteSpace: "nowrap" }}>수령 처리</button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── 메인 렌더 ──────────────────────────────────────
  return (
    <div style={{ padding: "24px", background: S.bg, minHeight: "100vh", fontFamily: "inherit" }}>

      {/* 토스트 */}
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 999, background: toast.ok ? S.green : S.red, color: "#fff", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600 }}>
          {toast.ok ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* 뒤로가기 */}
      {page !== "main" && (
        <button onClick={() => {
          if (page === "notify") setPage(sel ? "detail" : "main")
          else { setPage("main"); setSel(null); setNotifyTarget(null) }
        }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: S.text2, cursor: "pointer", marginBottom: "20px", padding: "6px 10px", borderRadius: "8px", border: S.border, background: S.surface, width: "fit-content" }}>
          ← {page === "notify" ? (sel?.name || "이전") : "당첨 내역으로"}
        </button>
      )}

      {/* ── 메인 ── */}
      {page === "main" && (
        <>
          {/* 페이지 헤더 */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: S.text }}>당첨 내역</div>
            <div style={{ fontSize: "12px", color: S.text3, marginTop: "3px" }}>
              추첨 당첨자 목록, 경품 수령 현황, 미수령 관리 및 알림 발송을 확인하세요
            </div>
          </div>

          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "20px" }}>
            {[
              { label: "전체 당첨자", value: `${total}명` },
              { label: "수령 완료", value: `${received}명`, color: S.green, sub: total ? `${Math.round(received / total * 100)}% 수령` : "-" },
              { label: "미수령", value: `${unreceived}명`, color: unreceived > 0 ? S.red : S.text, sub: "연락 필요" },
              { label: "다음 추첨", value: daysLeft !== null ? (daysLeft > 0 ? `D-${daysLeft}` : "오늘!") : "-", color: S.amber, sub: upcoming ? `${upcoming.prizeEmoji} ${upcoming.prizeName} · ${upcoming.round}회차` : "" },
            ].map(({ label, value, color, sub }) => (
              <div key={label} style={{ background: S.surface2, borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ fontSize: "12px", color: S.text3, marginBottom: "6px" }}>{label}</div>
                <div style={{ fontSize: "22px", fontWeight: 600, color: color || S.text }}>{value}</div>
                {sub && <div style={{ fontSize: "11px", color: S.text3, marginTop: "3px" }}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* 탭 */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "0", borderBottom: S.border2 }}>
            {([
              { key: "winners", label: "당첨자 목록" },
              { key: "prizes", label: "경품별 현황" },
              { key: "draws", label: "추첨 회차" },
              { key: "unreceived", label: `미수령 관리${unreceived > 0 ? ` (${unreceived})` : ""}` },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => { setTab(key); setShowCount(15) }}
                style={{ padding: "8px 16px", fontSize: "13px", cursor: "pointer", border: "none", background: "none", color: tab === key ? S.text : S.text3, fontWeight: tab === key ? 600 : 400, borderBottom: tab === key ? `2px solid ${S.text}` : "2px solid transparent", marginBottom: "-0.5px", fontFamily: "inherit" }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: "16px" }}>
            {/* 당첨자 목록 탭 */}
            {tab === "winners" && (
              <>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름/연락처 검색..."
                    style={{ ...inp, flex: 1, minWidth: "160px", fontSize: "13px", padding: "8px 12px" }} />
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                    style={{ ...inp, width: "110px", fontSize: "13px", padding: "8px 10px" }}>
                    <option value="all">전체</option>
                    <option value="received">수령완료</option>
                    <option value="unreceived">미수령</option>
                  </select>
                  <select value={filterPrize} onChange={e => setFilterPrize(e.target.value)}
                    style={{ ...inp, width: "130px", fontSize: "13px", padding: "8px 10px" }}>
                    <option value="all">경품 전체</option>
                    {prizes.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                  </select>
                </div>
                {loading
                  ? <div style={{ textAlign: "center", padding: "40px", color: S.text3, fontSize: "13px" }}>로딩 중...</div>
                  : (
                    <>
                      {filtered.slice(0, showCount).map(w => <WinnerRow key={w.id} w={w} />)}
                      {filtered.length === 0 && <div style={{ textAlign: "center", padding: "32px", fontSize: "13px", color: S.text3 }}>검색 결과 없음</div>}
                      {filtered.length > showCount && (
                        <button onClick={() => setShowCount(v => v + 15)}
                          style={{ width: "100%", padding: "9px", fontSize: "12px", color: S.text2, background: S.surface2, border: S.border, borderRadius: "8px", cursor: "pointer", marginTop: "4px" }}>
                          더 보기 ({filtered.length - showCount}명)
                        </button>
                      )}
                    </>
                  )}
              </>
            )}

            {tab === "prizes" && <TabPrizes />}
            {tab === "draws" && <TabDraws />}
            {tab === "unreceived" && <TabUnreceived />}
          </div>
        </>
      )}

      {/* ── 상세 ── */}
      {page === "detail" && sel && <DetailPage w={sel} />}

      {/* ── 알림 ── */}
      {page === "notify" && notifyTarget && <NotifyPage w={notifyTarget} />}

    </div>
  )
}

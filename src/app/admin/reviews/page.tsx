"use client"
import { useEffect, useState } from "react"

const S = {
  bg: "#F5F7FF", surface: "#FFFFFF", surface2: "#F8F9FF", surface3: "#EEF2FF",
  border: "1px solid #E5E9FF", border2: "1px solid #D4DCFF",
  accent: "#7C6EF5", accent2: "#9D91F7", accentBg: "rgba(124,110,245,0.12)",
  text: "#1A1F36", text2: "#6B7280", text3: "#9CA3AF",
  green: "#23D18B", greenBg: "rgba(35,209,139,0.12)",
  red: "#F4645F", redBg: "rgba(244,100,95,0.12)",
  amber: "#E8A838", amberBg: "rgba(232,168,56,0.12)",
  blue: "#58A6FF", blueBg: "rgba(88,166,255,0.12)",
  radius: "10px",
}

const PLATFORM_COLOR: Record<string, { bg: string; color: string }> = {
  naver:   { bg: "rgba(3,199,90,0.15)",   color: "#03C75A" },
  kakao:   { bg: "rgba(254,229,0,0.15)",   color: "#B8860B" },
  google:  { bg: "rgba(88,166,255,0.15)",  color: "#58A6FF" },
  baemin:  { bg: "rgba(0,188,172,0.15)",   color: "#00BCAC" },
  coupang: { bg: "rgba(255,87,34,0.15)",   color: "#FF5722" },
  etc:     { bg: S.surface2,               color: S.text3 },
}
const getPlatformStyle = (p: string) => PLATFORM_COLOR[p?.toLowerCase()] ?? PLATFORM_COLOR.etc

type Review = {
  id: number
  userId: string
  storeName: string
  platform: string
  menu: string | null
  people: number | null
  amount: number | null
  screenshotUrl: string | null
  status: string
  pbAwarded: number
  createdAt: string
  user: { name: string | null; email: string | null }
}

const fmt = (d: string) => new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterPlatform, setFilterPlatform] = useState("all")
  const [filterStore, setFilterStore] = useState("all")
  const [filterDate, setFilterDate] = useState("all")
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [showStats, setShowStats] = useState(true)

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = () => {
    setLoading(true)
    fetch("/api/admin/reviews")
      .then(r => r.json())
      .then(d => setReviews(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("리뷰를 삭제할까요?")) return
    const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" })
    if (!res.ok) return showToast("삭제 실패", "error")
    showToast("삭제 완료")
    load()
  }

  const platforms = ["all", ...Array.from(new Set(reviews.map(r => r.platform).filter(Boolean)))]
  const stores = ["all", ...Array.from(new Set(reviews.map(r => r.storeName).filter(Boolean)))]

  const now = new Date()
  const filtered = reviews.filter(r => {
    const matchSearch = !search ||
      r.user?.name?.includes(search) ||
      r.user?.email?.includes(search) ||
      r.storeName?.includes(search)
    const matchPlatform = filterPlatform === "all" || r.platform === filterPlatform
    const matchStore = filterStore === "all" || r.storeName === filterStore
    const d = new Date(r.createdAt)
    const matchDate = filterDate === "all" ? true
      : filterDate === "today" ? d.toDateString() === now.toDateString()
      : filterDate === "week" ? (now.getTime() - d.getTime()) < 7 * 86400000
      : filterDate === "month" ? (now.getTime() - d.getTime()) < 30 * 86400000
      : true
    return matchSearch && matchPlatform && matchStore && matchDate
  })

  const platformStats = platforms.filter(p => p !== "all").map(p => ({
    name: p,
    count: reviews.filter(r => r.platform === p).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.platform === p).length / reviews.length * 100) : 0,
  })).sort((a, b) => b.count - a.count)

  const storeStats = Array.from(new Set(reviews.map(r => r.storeName))).map(s => ({
    name: s,
    count: reviews.filter(r => r.storeName === s).length,
  })).sort((a, b) => b.count - a.count).slice(0, 5)

  const inp: React.CSSProperties = {
    padding: "8px 12px", borderRadius: "8px", border: "1px solid #D4DCFF",
    background: S.surface2, color: S.text, fontSize: "12px", outline: "none",
  }
  const lbl: React.CSSProperties = {
    fontSize: "10px", fontWeight: 600, color: S.text3,
    textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "5px",
  }

  return (
    <div style={{ padding: "24px", background: S.bg, minHeight: "100vh", fontFamily: "inherit" }}>

      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 999, background: toast.type === "success" ? S.green : S.red, color: "#fff", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: S.text }}>리뷰 내역</div>
          <div style={{ fontSize: "12px", color: S.text3, marginTop: "3px" }}>
            전체 {reviews.length}건 · 검색결과 {filtered.length}건
          </div>
        </div>
        <button onClick={() => setShowStats(v => !v)}
          style={{ padding: "7px 14px", background: showStats ? S.accentBg : S.surface2, color: showStats ? S.accent2 : S.text2, border: S.border2, borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
          {showStats ? "통계 닫기" : "통계 보기"}
        </button>
      </div>

      {showStats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div style={{ background: S.surface, border: S.border, borderRadius: S.radius, padding: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: S.text, marginBottom: "12px" }}>플랫폼별 비율</div>
            {platformStats.length === 0 ? (
              <div style={{ fontSize: "12px", color: S.text3, textAlign: "center", padding: "16px 0" }}>데이터 없음</div>
            ) : platformStats.map(p => (
              <div key={p.name} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ ...getPlatformStyle(p.name), fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: getPlatformStyle(p.name).bg }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: "11px", color: S.text2 }}>{p.count}건 ({p.pct}%)</span>
                </div>
                <div style={{ height: "4px", background: S.surface3, borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${p.pct}%`, background: getPlatformStyle(p.name).color, borderRadius: "2px" }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: S.surface, border: S.border, borderRadius: S.radius, padding: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: S.text, marginBottom: "12px" }}>매장별 TOP 5</div>
            {storeStats.length === 0 ? (
              <div style={{ fontSize: "12px", color: S.text3, textAlign: "center", padding: "16px 0" }}>데이터 없음</div>
            ) : storeStats.map((s, i) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", borderBottom: i < storeStats.length - 1 ? S.border : "none" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "6px", background: i === 0 ? S.amberBg : S.surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: i === 0 ? S.amber : S.text3, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, fontSize: "12px", color: S.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: S.accent2 }}>{s.count}건</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={lbl}>검색</label>
          <input style={{ ...inp, width: "200px" }} value={search} onChange={e => setSearch(e.target.value)} placeholder="유저명, 매장명 검색..." />
        </div>
        <div>
          <label style={lbl}>플랫폼</label>
          <select style={inp} value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
            {platforms.map(p => <option key={p} value={p}>{p === "all" ? "전체" : p}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>매장</label>
          <select style={{ ...inp, maxWidth: "160px" }} value={filterStore} onChange={e => setFilterStore(e.target.value)}>
            {stores.map(s => <option key={s} value={s}>{s === "all" ? "전체" : s}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>기간</label>
          <select style={inp} value={filterDate} onChange={e => setFilterDate(e.target.value)}>
            <option value="all">전체</option>
            <option value="today">오늘</option>
            <option value="week">최근 7일</option>
            <option value="month">최근 30일</option>
          </select>
        </div>
        {(search || filterPlatform !== "all" || filterStore !== "all" || filterDate !== "all") && (
          <button onClick={() => { setSearch(""); setFilterPlatform("all"); setFilterStore("all"); setFilterDate("all") }}
            style={{ padding: "8px 12px", background: S.redBg, color: S.red, border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", alignSelf: "flex-end" }}>
            초기화
          </button>
        )}
      </div>

      <div style={{ background: S.surface, border: S.border, borderRadius: S.radius, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 80px", padding: "9px 16px", background: S.surface2, borderBottom: S.border }}>
          {["유저", "매장", "플랫폼", "메뉴", "금액", "날짜", ""].map((h, i) => (
            <div key={i} style={{ fontSize: "10px", fontWeight: 700, color: S.text3, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: S.text3, fontSize: "13px" }}>로딩 중...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", opacity: 0.3, marginBottom: "8px" }}>📋</div>
            <div style={{ fontSize: "13px", color: S.text3 }}>리뷰 내역이 없습니다</div>
          </div>
        ) : filtered.map(r => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 80px", padding: "11px 16px", borderBottom: S.border, alignItems: "center", transition: "background 0.1s" }}
            onMouseEnter={e => (e.currentTarget.style.background = S.surface2)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: S.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: S.accent2, flexShrink: 0 }}>
                {(r.user?.name || r.user?.email || "?")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: S.text }}>{r.user?.name || "이름 없음"}</div>
                <div style={{ fontSize: "11px", color: S.text3 }}>{r.user?.email}</div>
              </div>
            </div>

            <div style={{ fontSize: "12px", color: S.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "8px" }}>
              {r.storeName}
            </div>

            <div>
              <span style={{ ...getPlatformStyle(r.platform), fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "20px", background: getPlatformStyle(r.platform).bg }}>
                {r.platform}
              </span>
            </div>

            <div style={{ fontSize: "12px", color: S.text2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.menu || "-"}
            </div>

            <div style={{ fontSize: "12px", color: S.text2 }}>
              {r.amount ? `${r.amount.toLocaleString()}원` : "-"}
            </div>

            <div style={{ fontSize: "11px", color: S.text3 }}>{fmt(r.createdAt)}</div>

            <div style={{ display: "flex", gap: "4px" }}>
              {r.screenshotUrl && (
                <button onClick={() => setScreenshot(r.screenshotUrl!)}
                  style={{ padding: "4px 8px", background: S.blueBg, color: S.blue, border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                  사진
                </button>
              )}
              <button onClick={() => handleDelete(r.id)}
                style={{ padding: "4px 8px", background: S.redBg, color: S.red, border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {screenshot && (
        <div onClick={() => setScreenshot(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", cursor: "pointer" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "600px", width: "100%" }}>
            <img src={screenshot} style={{ width: "100%", borderRadius: "12px", display: "block" }} />
            <button onClick={() => setScreenshot(null)}
              style={{ position: "absolute", top: "-12px", right: "-12px", width: "28px", height: "28px", borderRadius: "50%", background: S.surface, border: S.border2, color: S.text2, cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

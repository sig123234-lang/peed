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

type WinnerRecord = {
  id: number
  prizeId: string
  prizeName: string
  prizeEmoji: string
  prizeValue: string
  drawRound: number
  drawDate: string
  received: boolean
  receivedDate: string | null
  usedPb: number
  cancelStatus: "none" | "inquiry" | "cancelled"
  cancelReason: string | null
  cancelHistory: { type: string; text: string; date: string }[]
}

type User = {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  uniqueCode: string | null
  joinDate: string
  holdingPb: number
  usedPb: number
  totalPb: number   // DB 기록 총 PB
  reviewCount: number
  reviews: Review[]
  winners: WinnerRecord[]
  suspicious: boolean
  diff: number      // 초과 PB
}

// ── 디자인 토큰 ──────────────────────────────────
const S = {
  bg: "#F5F7FF", surface: "#FFFFFF", surface2: "#F8F9FF", surface3: "#EEF2FF",
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

const PLATFORM_COLOR: Record<string, { bg: string; color: string }> = {
  naver:   { bg: "rgba(3,199,90,0.15)",   color: "#03C75A" },
  kakao:   { bg: "rgba(254,229,0,0.15)",   color: "#B8860B" },
  google:  { bg: "rgba(88,166,255,0.15)",  color: "#58A6FF" },
  baemin:  { bg: "rgba(0,188,172,0.15)",   color: "#00BCAC" },
  coupang: { bg: "rgba(255,87,34,0.15)",   color: "#FF5722" },
}
const plStyle = (p: string) => PLATFORM_COLOR[p?.toLowerCase()] ?? { bg: S.surface2, color: S.text3 }

const inp: React.CSSProperties = {
  padding: "7px 10px", borderRadius: "8px", border: "1px solid #D4DCFF",
  background: S.surface2, color: S.text, fontSize: "12px", outline: "none",
  width: "100%", fontFamily: "inherit",
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"all" | "fraud" | "normal">("all")
  const [sort, setSort] = useState<"fraud" | "pb" | "review" | "recent">("fraud")
  const [showCount, setShowCount] = useState(15)
  const [sel, setSel] = useState<User | null>(null)
  const [page, setPage] = useState<"main" | "detail" | "sms" | "cancel">("main")
  const [smsType, setSmsType] = useState<"inquiry" | "cancel">("inquiry")
  const [selWinner, setSelWinner] = useState<WinnerRecord | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const load = () => {
    setLoading(true)
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => setUsers(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // ── 리스트 필터 ───────────────────────────────────
  const getList = () => {
    const q = search.toLowerCase()
    let list = [...users]
    if (tab === "fraud") list = list.filter(u => u.suspicious)
    if (tab === "normal") list = list.filter(u => !u.suspicious)
    if (q) list = list.filter(u =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phone || "").includes(q) ||
      (u.uniqueCode || "").toLowerCase().includes(q)
    )
    if (sort === "fraud")  list.sort((a, b) => b.diff - a.diff)
    if (sort === "pb")     list.sort((a, b) => b.holdingPb - a.holdingPb)
    if (sort === "review") list.sort((a, b) => b.reviewCount - a.reviewCount)
    if (sort === "recent") list.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
    return list
  }

  // ── API 액션 ──────────────────────────────────────
  const markSmsSent = async (userId: number, wId: number, type: "inquiry" | "cancel") => {
    await fetch("/api/admin/winners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId: wId, action: "sms", smsType: type }),
    })
    showToast("발송 완료로 기록됐어요")
    setPage("detail")
    load()
  }

  const doCancel = async () => {
    if (!sel || !selWinner) return
    if (!cancelReason.trim()) return showToast("취소 사유를 입력해주세요", false)
    const res = await fetch("/api/admin/winners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        winnerId: selWinner.id,
        action: "cancel",
        reason: cancelReason,
      }),
    })
    if (!res.ok) return showToast("취소 처리 실패", false)
    showToast("취소 완료! PB가 복구됐어요")
    setCancelReason("")
    setPage("detail")
    load()
  }

  // ── SMS 텍스트 ────────────────────────────────────
  const getSMSText = (u: User, w: WinnerRecord, type: "inquiry" | "cancel") => {
    if (type === "inquiry") {
      return `안녕하세요, ${u.name || "고객"}님.\nPEED 운영팀입니다.\n\n회원님의 계정을 확인하던 중\n아래와 같은 사항이 발견되어 연락드립니다.\n\n📋 확인 사항\n• 보유 PB: ${u.holdingPb}PB\n• 사용 PB: ${u.usedPb}PB\n• 총 PB: ${u.totalPb}PB\n• 작성 리뷰 수: ${u.reviewCount}건\n• 정상 획득 가능 PB: ${u.reviewCount}PB\n\n리뷰 수와 보유 PB가 일치하지 않습니다.\n\n혹시 오류가 있다면 이 문자를 받으신 후\n3일 이내로 회신 부탁드립니다.\n\n소명이 없거나 적합하지 않을 경우\n당첨 경품(${w.prizeEmoji} ${w.prizeName}) 증정이\n취소될 수 있음을 안내드립니다.\n\nPEED 운영팀`
    }
    return `안녕하세요, ${u.name || "고객"}님.\nPEED 운영팀입니다.\n\n앞서 안내드린 PB 불일치 관련하여\n소명 기한이 경과하였습니다.\n\n이에 따라 아래와 같이 처리됩니다.\n\n❌ 당첨 취소 안내\n• 경품: ${w.prizeEmoji} ${w.prizeName}\n• 취소 사유: PB 불일치 (소명 미제출)\n• 사용 PB: ${w.usedPb}PB 복구 예정\n\n부정한 방법으로 PB를 획득한 것으로\n판단되어 당첨이 취소됩니다.\n\n이의가 있으신 경우 고객센터로\n연락 주시기 바랍니다.\n\nPEED 운영팀`
  }

  // ── 리스트 아이템 ─────────────────────────────────
  const UserRow = ({ u }: { u: User }) => (
    <div onClick={() => { setSel(u); setPage("detail") }}
      style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "8px", border: u.suspicious ? `0.5px solid ${S.red}44` : S.border, background: u.suspicious ? `rgba(244,100,95,0.04)` : S.surface, marginBottom: "6px", cursor: "pointer", transition: "background .12s", borderLeft: u.suspicious ? `2px solid ${S.red}` : undefined }}
      onMouseEnter={e => (e.currentTarget.style.background = S.surface2)}
      onMouseLeave={e => (e.currentTarget.style.background = u.suspicious ? `rgba(244,100,95,0.04)` : S.surface)}
    >
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: u.suspicious ? S.redBg : S.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600, color: u.suspicious ? S.red : S.accent, flexShrink: 0 }}>
        {(u.name || u.email || "?")[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: S.text }}>{u.name || "이름 없음"}</span>
          {u.uniqueCode && <span style={{ fontFamily: "monospace", fontSize: "11px", color: S.text3 }}>{u.uniqueCode}</span>}
          {u.suspicious
            ? <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: "20px", background: S.redBg, color: S.red }}>부정 의심 +{u.diff}PB</span>
            : <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: "20px", background: S.greenBg, color: S.green }}>정상</span>}
        </div>
        <div style={{ fontSize: "12px", color: S.text3 }}>
          보유 <strong style={{ color: S.text2 }}>{u.holdingPb}PB</strong> · 사용 <strong style={{ color: S.text2 }}>{u.usedPb}PB</strong> · 리뷰 <strong style={{ color: S.text2 }}>{u.reviewCount}건</strong>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: u.suspicious ? S.red : S.accent }}>{u.holdingPb}PB</div>
        <div style={{ fontSize: "11px", color: S.text3, marginTop: "1px" }}>보유</div>
      </div>
    </div>
  )

  // ── 상세 페이지 ───────────────────────────────────
  const DetailPage = ({ u }: { u: User }) => {
    const fraud = u.suspicious
    const totalAmt = u.reviews.reduce((a, rv) => a + (rv.amount ?? 0), 0)

    // 플랫폼별 카운트
    const platformCounts: Record<string, number> = {}
    u.reviews.forEach(rv => { platformCounts[rv.platform] = (platformCounts[rv.platform] || 0) + 1 })

    return (
      <div>
        {/* 프로필 */}
        <div style={{ background: S.surface2, borderRadius: S.radiusLg, padding: "18px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: fraud ? S.redBg : S.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 600, color: fraud ? S.red : S.accent, flexShrink: 0 }}>
            {(u.name || u.email || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "18px", fontWeight: 600, color: S.text, marginBottom: "2px" }}>{u.name || "이름 없음"}</div>
            <div style={{ fontSize: "13px", color: S.text2, marginBottom: "3px" }}>{u.email}{u.phone ? ` · ${u.phone}` : ""}</div>
            {u.uniqueCode && <div style={{ fontFamily: "monospace", fontSize: "12px", color: S.text3 }}>{u.uniqueCode} · 가입 {new Date(u.joinDate).toLocaleDateString("ko-KR")}</div>}
          </div>
          <span style={{ fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "20px", background: fraud ? S.redBg : S.greenBg, color: fraud ? S.red : S.green, flexShrink: 0 }}>
            {fraud ? "⚠ 부정 의심" : "✓ 정상"}
          </span>
        </div>

        {/* PB 현황 — 핵심 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "12px" }}>
          {[
            { label: "보유 PB", value: u.holdingPb, color: S.accent, sub: "현재 잔액" },
            { label: "사용 PB", value: u.usedPb, color: S.amber, sub: "응모 사용" },
            { label: "리뷰 수", value: u.reviewCount, color: fraud ? S.red : S.green, sub: "= 정상 PB" },
          ].map(({ label, value, color, sub }) => (
            <div key={label} style={{ background: S.surface2, borderRadius: "8px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: S.text3, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
              <div style={{ fontSize: "22px", fontWeight: 600, color }}>{value}</div>
              <div style={{ fontSize: "11px", color: S.text3, marginTop: "2px" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* PB 불일치 배너 */}
        <div style={{ background: fraud ? S.redBg : S.greenBg, border: `0.5px solid ${fraud ? S.red : S.green}44`, borderRadius: S.radiusLg, padding: "13px 15px", marginBottom: "12px", fontSize: "13px", lineHeight: 1.7, color: fraud ? S.red : S.green }}>
          {fraud ? (
            <>
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>⚠ PB 불일치 감지</div>
              리뷰 {u.reviewCount}건 → 획득 가능 PB: <strong>{u.reviewCount}PB</strong><br />
              DB 기록 PB: <strong>{u.totalPb}PB</strong> → 초과: <strong>+{u.diff}PB</strong><br />
              <span style={{ fontSize: "12px", opacity: 0.85 }}>리뷰 수보다 {u.diff}PB 많습니다. 허위 리뷰 또는 비정상 적립 의심.</span>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600, marginBottom: "3px" }}>✓ PB 정상</div>
              리뷰 {u.reviewCount}건 = 획득 PB {u.reviewCount}개 — 일치해요
            </>
          )}
        </div>

        {/* PB 검증 상세 */}
        <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "14px 16px", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: S.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingBottom: "5px", borderBottom: S.border }}>PB 검증</div>
          {[
            { k: "보유 PB", v: `${u.holdingPb} PB`, c: S.accent },
            { k: "사용 PB (응모)", v: `${u.usedPb} PB`, c: S.amber },
            { k: "총 PB (보유+사용)", v: `${u.totalPb} PB`, c: S.text },
            { k: "리뷰 수 (정상 PB)", v: `${u.reviewCount} PB`, c: S.text },
          ].map(({ k, v, c }) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: S.border, fontSize: "13px" }}>
              <span style={{ color: S.text2 }}>{k}</span>
              <span style={{ fontWeight: 600, color: c }}>{v}</span>
            </div>
          ))}
          {/* 차이 */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", marginTop: "6px", borderRadius: "8px", background: fraud ? S.redBg : S.greenBg }}>
            <span style={{ fontWeight: 600, color: fraud ? S.red : S.green }}>차이</span>
            <span style={{ fontSize: "15px", fontWeight: 600, color: fraud ? S.red : S.green }}>
              {fraud ? `+${u.diff}PB 초과 ⚠` : "0 — 일치 ✓"}
            </span>
          </div>
          {/* 진행 바 */}
          <div style={{ marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: S.text3, marginBottom: "4px" }}>
              <span>정상 PB 비율</span>
              <span>{Math.min(100, Math.round(u.reviewCount / Math.max(u.totalPb, 1) * 100))}%</span>
            </div>
            <div style={{ height: "6px", background: S.surface2, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, Math.round(u.reviewCount / Math.max(u.totalPb, 1) * 100))}%`, background: fraud ? S.red : S.green, borderRadius: "3px" }} />
            </div>
          </div>
        </div>

        {/* 상품 증정 취소 섹션 */}
        {u.winners.length > 0 && (
          <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "14px 16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", color: S.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", paddingBottom: "5px", borderBottom: S.border }}>상품 증정 취소</div>
            {u.winners.map(w => {
              const cancelled = w.cancelStatus === "cancelled"
              const inquired = w.cancelStatus === "inquiry"
              return (
                <div key={w.id} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: S.border }}>
                  {/* 경품 정보 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ fontSize: "22px" }}>{w.prizeEmoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: S.text }}>{w.prizeName}</div>
                      <div style={{ fontSize: "12px", color: S.text3 }}>{w.prizeValue} · {w.drawRound}회차 · 사용 {w.usedPb}PB</div>
                    </div>
                    <span style={{ fontSize: "11px", padding: "3px 9px", borderRadius: "20px", background: cancelled ? S.surface2 : inquired ? S.amberBg : S.greenBg, color: cancelled ? S.text3 : inquired ? S.amber : S.green }}>
                      {cancelled ? "취소됨" : inquired ? "소명 대기" : "정상"}
                    </span>
                  </div>

                  {/* 단계 표시 */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: "4px", alignItems: "center", marginBottom: "10px" }}>
                    {[
                      { label: "1단계\n소명 요청", done: inquired || cancelled },
                      { label: "2단계\n취소 안내", done: cancelled, active: inquired },
                      { label: "3단계\nPB 복구", done: cancelled },
                    ].map(({ label, done, active }, i) => (
                      <>
                        <div key={i} style={{ padding: "6px 8px", borderRadius: "6px", background: done ? S.greenBg : active ? S.amberBg : S.surface2, textAlign: "center", fontSize: "10px", fontWeight: 600, color: done ? S.green : active ? S.amber : S.text3, lineHeight: 1.5, whiteSpace: "pre-line" }}>
                          {label}
                        </div>
                        {i < 2 && <div key={`arr-${i}`} style={{ fontSize: "11px", color: S.text3, textAlign: "center" }}>→</div>}
                      </>
                    ))}
                  </div>

                  {/* 취소 이력 */}
                  {w.cancelHistory.length > 0 && (
                    <div style={{ marginBottom: "10px" }}>
                      {w.cancelHistory.map((h, i) => (
                        <div key={i} style={{ display: "flex", gap: "8px", padding: "5px 0", fontSize: "12px", borderBottom: S.border }}>
                          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: h.type === "inquiry" ? S.amber : h.type === "cancel" ? S.red : S.green, flexShrink: 0, marginTop: "4px" }} />
                          <div>
                            <div style={{ color: S.text2 }}>{h.text}</div>
                            <div style={{ fontSize: "11px", color: S.text3 }}>{h.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 버튼들 */}
                  {!cancelled && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {!inquired && (
                        <button onClick={() => { setSelWinner(w); setSmsType("inquiry"); setPage("sms") }}
                          style={{ width: "100%", padding: "9px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.amber}`, background: S.amberBg, color: S.amber, cursor: "pointer" }}>
                          1단계 — 소명 요청 문자 발송
                        </button>
                      )}
                      {inquired && (
                        <button onClick={() => { setSelWinner(w); setSmsType("cancel"); setPage("sms") }}
                          style={{ width: "100%", padding: "9px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.blue}`, background: S.blueBg, color: S.blue, cursor: "pointer" }}>
                          2단계 — 취소 안내 문자 발송
                        </button>
                      )}
                      <button onClick={() => { setSelWinner(w); setCancelReason(""); setPage("cancel") }}
                        style={{ width: "100%", padding: "9px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.red}`, background: S.redBg, color: S.red, cursor: "pointer" }}>
                        {inquired ? "3단계 — 최종 취소 처리" : "바로 취소하기"}
                      </button>
                    </div>
                  )}
                  {cancelled && w.cancelReason && (
                    <div style={{ background: S.surface2, borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: S.text3 }}>
                      취소 사유: {w.cancelReason}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 리뷰 목록 */}
        <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "14px 16px", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: S.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingBottom: "5px", borderBottom: S.border }}>
            작성 리뷰 ({u.reviews.length}건) · 총 {Math.round(totalAmt / 10000)}만원
          </div>
          {u.reviews.length === 0
            ? <div style={{ fontSize: "13px", color: S.text3, padding: "8px 0", textAlign: "center" }}>리뷰 없음</div>
            : u.reviews.map(rv => (
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
          {u.reviews.length > 0 && (
            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: S.border }}>
              <div style={{ fontSize: "11px", color: S.text3, marginBottom: "6px" }}>플랫폼별 리뷰</div>
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

  // ── SMS 페이지 ────────────────────────────────────
  const SMSPage = ({ u, w }: { u: User; w: WinnerRecord }) => {
    const txt = getSMSText(u, w, smsType)
    return (
      <div>
        <div style={{ fontSize: "17px", fontWeight: 600, color: S.text, marginBottom: "4px" }}>
          {smsType === "inquiry" ? "1단계 — 소명 요청 문자" : "2단계 — 취소 안내 문자"}
        </div>
        <div style={{ fontSize: "13px", color: S.text2, marginBottom: "20px" }}>{u.name} · {u.phone || u.email}</div>
        <div style={{ background: S.surface2, borderRadius: S.radiusLg, padding: "16px", fontSize: "13px", lineHeight: 1.8, whiteSpace: "pre-wrap", color: S.text, marginBottom: "12px" }}>{txt}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button onClick={() => navigator.clipboard.writeText(txt).then(() => showToast("복사됐어요!"))}
            style={{ padding: "11px", fontSize: "13px", borderRadius: "8px", border: S.border2, background: S.surface2, color: S.text2, cursor: "pointer" }}>복사하기</button>
          <button onClick={() => markSmsSent(u.id, w.id, smsType)}
            style={{ padding: "11px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.green}`, background: S.greenBg, color: S.green, cursor: "pointer" }}>발송 완료 기록</button>
        </div>
      </div>
    )
  }

  // ── 취소 페이지 ───────────────────────────────────
  const CancelPage = ({ u, w }: { u: User; w: WinnerRecord }) => (
    <div>
      <div style={{ fontSize: "17px", fontWeight: 600, color: S.text, marginBottom: "4px" }}>상품 증정 취소</div>
      <div style={{ fontSize: "13px", color: S.text2, marginBottom: "20px" }}>{u.name} · {w.prizeEmoji} {w.prizeName}</div>

      <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "14px 16px", marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", color: S.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingBottom: "5px", borderBottom: S.border }}>취소 내용</div>
        {[
          { k: "대상자", v: `${u.name} (${u.phone || u.email})` },
          { k: "취소 경품", v: `${w.prizeEmoji} ${w.prizeName} (${w.prizeValue})` },
          { k: "복구될 PB", v: `+${w.usedPb} PB`, c: S.green },
          { k: "취소 후 보유 PB", v: `${u.holdingPb + w.usedPb} PB`, c: S.accent },
        ].map(({ k, v, c }) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: S.border, fontSize: "13px" }}>
            <span style={{ color: S.text2 }}>{k}</span>
            <span style={{ fontWeight: 600, color: c || S.text }}>{v}</span>
          </div>
        ))}
      </div>

      {w.cancelStatus === "inquiry" && (
        <div style={{ background: S.amberBg, border: `0.5px solid ${S.amber}33`, borderRadius: S.radiusLg, padding: "12px 14px", marginBottom: "12px", fontSize: "13px", color: S.amber }}>
          소명 요청을 발송했어요. 취소 전 취소 안내 문자를 먼저 발송하는 걸 권장해요.
        </div>
      )}

      <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "14px 16px", marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", color: S.text3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingBottom: "5px", borderBottom: S.border }}>
          취소 사유 <span style={{ color: S.red }}>*</span>
        </div>
        <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder={`예: PB 불일치 — 리뷰 ${u.reviewCount}건 대비 ${u.diff}PB 초과 보유, 소명 미제출`}
          style={{ ...inp, resize: "vertical", minHeight: "72px" }} />
      </div>

      <div style={{ background: S.redBg, border: `0.5px solid ${S.red}44`, borderRadius: S.radiusLg, padding: "12px 14px", marginBottom: "12px", fontSize: "13px", color: S.red }}>
        취소 시 사용한 PB {w.usedPb}개가 복구되고, 이 작업은 되돌릴 수 없어요.
      </div>

      <button onClick={doCancel}
        style={{ width: "100%", padding: "13px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.red}`, background: S.redBg, color: S.red, cursor: "pointer" }}>
        상품 증정 취소 및 PB {w.usedPb}개 복구
      </button>
    </div>
  )

  // ── 메인 렌더 ──────────────────────────────────────
  const list = getList()

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
          if (page === "sms" || page === "cancel") setPage("detail")
          else { setPage("main"); setSel(null); setSelWinner(null) }
        }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: S.text2, cursor: "pointer", marginBottom: "20px", padding: "6px 10px", borderRadius: "8px", border: S.border, background: S.surface, width: "fit-content" }}>
          ← {page === "sms" || page === "cancel" ? sel?.name || "유저 상세" : "유저 목록"}
        </button>
      )}

      {/* ── 메인 ── */}
      {page === "main" && (
        <>
          {/* 페이지 헤더 */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: S.text }}>유저 관리</div>
            <div style={{ fontSize: "12px", color: S.text3, marginTop: "3px" }}>
              전체 유저 PB 현황, 부정 의심 유저 감지 및 상품 증정 취소 처리를 관리하세요
            </div>
          </div>

          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "20px" }}>
            {[
              { label: "전체 유저", value: `${users.length}명` },
              { label: "총 발급 PB", value: `${users.reduce((a, u) => a + u.totalPb, 0)}`, color: S.accent, sub: "리뷰 기반" },
              { label: "총 사용 PB", value: `${users.reduce((a, u) => a + u.usedPb, 0)}`, color: S.amber, sub: "응모 사용" },
              { label: "부정 의심", value: `${users.filter(u => u.suspicious).length}명`, color: S.red, sub: "PB ≠ 리뷰 수" },
            ].map(({ label, value, color, sub }) => (
              <div key={label} style={{ background: S.surface2, borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ fontSize: "12px", color: S.text3, marginBottom: "6px" }}>{label}</div>
                <div style={{ fontSize: "22px", fontWeight: 600, color: color || S.text }}>{value}</div>
                {sub && <div style={{ fontSize: "11px", color: S.text3, marginTop: "3px" }}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* 탭 + 검색 */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "0", borderBottom: S.border2 }}>
            {(["all", "fraud", "normal"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setShowCount(15) }}
                style={{ padding: "8px 16px", fontSize: "13px", cursor: "pointer", border: "none", background: "none", color: tab === t ? S.text : S.text3, fontWeight: tab === t ? 600 : 400, borderBottom: tab === t ? `2px solid ${S.text}` : "2px solid transparent", marginBottom: "-0.5px", fontFamily: "inherit" }}>
                {t === "all" ? "전체 유저" : t === "fraud" ? `부정 의심 (${users.filter(u => u.suspicious).length})` : "정상 유저"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", margin: "14px 0 12px", flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름/연락처/코드 검색..."
              style={{ ...inp, flex: 1, minWidth: "160px", fontSize: "13px", padding: "8px 12px" }} />
            <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
              style={{ ...inp, width: "140px", fontSize: "13px", padding: "8px 12px" }}>
              <option value="fraud">부정 의심 먼저</option>
              <option value="pb">PB 많은 순</option>
              <option value="review">리뷰 많은 순</option>
              <option value="recent">최근 가입 순</option>
            </select>
          </div>

          {loading
            ? <div style={{ textAlign: "center", padding: "40px", color: S.text3, fontSize: "13px" }}>로딩 중...</div>
            : (
              <>
                {list.slice(0, showCount).map(u => <UserRow key={u.id} u={u} />)}
                {list.length === 0 && <div style={{ textAlign: "center", padding: "32px", fontSize: "13px", color: S.text3 }}>없어요</div>}
                {list.length > showCount && (
                  <button onClick={() => setShowCount(v => v + 15)}
                    style={{ width: "100%", padding: "9px", fontSize: "12px", color: S.text2, background: S.surface2, border: S.border, borderRadius: "8px", cursor: "pointer", marginTop: "4px" }}>
                    더 보기 ({list.length - showCount}명)
                  </button>
                )}
              </>
            )}
        </>
      )}

      {/* ── 상세 ── */}
      {page === "detail" && sel && <DetailPage u={sel} />}

      {/* ── SMS ── */}
      {page === "sms" && sel && selWinner && <SMSPage u={sel} w={selWinner} />}

      {/* ── 취소 ── */}
      {page === "cancel" && sel && selWinner && <CancelPage u={sel} w={selWinner} />}

    </div>
  )
}

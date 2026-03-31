"use client"
import { useEffect, useState, useRef } from "react"

// ── 디자인 토큰 ───────────────────────────────────
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

type Tab = "overview" | "demo" | "store" | "time" | "ai"

type Message = { role: "user" | "assistant"; content: string }

type Stats = {
  totalUsers: number
  totalReviews: number
  avgAmount: number
  activeStores: number
  platformBreakdown: { name: string; count: number }[]
  weeklyTrend: { label: string; count: number }[]
  genderBreakdown: { female: number; male: number }
  ageBreakdown: { age: string; female: number; male: number }[]
  storeRanking: { name: string; reviews: number; avgAmount: number }[]
  hourlyData: number[]
  dowData: { day: string; count: number }[]
}

const PLATFORM_COLORS: Record<string, string> = {
  naver: "#03C75A", kakao: "#FEE500", google: "#4285F4",
  baemin: "#00BCAC", coupang: "#FF5722",
}

export default function AdminInsightPage() {
  const [tab, setTab] = useState<Tab>("overview")
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "안녕하세요! PEED 데이터 분석 AI입니다 👋\n현재 유저 데이터와 리뷰를 기반으로 인사이트를 제공해드려요. 궁금한 것을 물어보세요!" }
  ])
  const [input, setInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/admin/insights")
      .then(r => r.json())
      .then(d => setStats(d))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const sendMessage = async (text?: string) => {
    const q = text || input.trim()
    if (!q || aiLoading) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: q }])
    setAiLoading(true)
    try {
      const res = await fetch("/api/admin/insights/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, stats }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "분석 중 오류가 발생했어요." }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "오류가 발생했어요. 다시 시도해주세요." }])
    } finally {
      setAiLoading(false)
    }
  }

  const BarRow = ({ label, value, max, color, suffix = "" }: { label: string; value: number; max: number; color: string; suffix?: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
      <div style={{ fontSize: "12px", color: S.text2, minWidth: "72px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ flex: 1, height: "5px", background: S.surface3, borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.round(value / max * 100)}%`, background: color, borderRadius: "3px", transition: "width .6s ease" }} />
      </div>
      <div style={{ fontSize: "11px", color: S.text3, minWidth: "40px", textAlign: "right" }}>{value.toLocaleString()}{suffix}</div>
    </div>
  )

  const Card = ({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "16px", ...style }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: S.text, marginBottom: "14px" }}>{title}</div>
      {children}
    </div>
  )

  // ── 탭 콘텐츠 ─────────────────────────────────────

  const TabOverview = () => {
    if (!stats) return null
    const maxPlatform = Math.max(...stats.platformBreakdown.map(p => p.count))
    const maxTrend = Math.max(...stats.weeklyTrend.map(w => w.count))
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* KPI 4개 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
          {[
            { label: "전체 유저", value: stats.totalUsers.toLocaleString(), color: S.accent, sub: "명" },
            { label: "총 리뷰", value: stats.totalReviews.toLocaleString(), color: S.green, sub: "건" },
            { label: "평균 결제금액", value: stats.avgAmount.toLocaleString(), color: S.amber, sub: "원" },
            { label: "활성 매장", value: stats.activeStores.toLocaleString(), color: S.blue, sub: "개" },
          ].map(({ label, value, color, sub }) => (
            <div key={label} style={{ background: S.surface2, borderRadius: S.radius, padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", color: S.text3, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
              <div style={{ fontSize: "22px", fontWeight: 600, color }}>{value}<span style={{ fontSize: "13px", color: S.text3, marginLeft: "3px" }}>{sub}</span></div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Card title="플랫폼별 리뷰">
            {stats.platformBreakdown.map(p => (
              <BarRow key={p.name} label={p.name} value={p.count} max={maxPlatform} color={PLATFORM_COLORS[p.name] || S.accent} />
            ))}
          </Card>
          <Card title="주간 리뷰 트렌드">
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
              {stats.weeklyTrend.map((w, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ width: "100%", background: i === stats.weeklyTrend.length - 1 ? S.blue : S.surface3, borderRadius: "3px 3px 0 0", height: `${Math.round(w.count / maxTrend * 72)}px`, transition: "height .5s" }} />
                  <div style={{ fontSize: "10px", color: S.text3 }}>{w.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const TabDemo = () => {
    if (!stats) return null
    const { genderBreakdown, ageBreakdown } = stats
    const total = genderBreakdown.female + genderBreakdown.male
    const femalePct = Math.round(genderBreakdown.female / total * 100)
    const malePct = 100 - femalePct
    const AGE_MENU: Record<string, string[]> = {
      "10대": ["떡볶이", "치킨", "버블티"],
      "20대": ["아메리카노", "파스타", "초밥"],
      "30대": ["삼겹살", "라멘", "스테이크"],
      "40대": ["된장찌개", "감자탕", "불고기"],
    }
    const maxAge = Math.max(...ageBreakdown.map(a => a.female + a.male))
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Card title="성별 분포">
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "12px" }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "28px", fontWeight: 600, color: S.blue }}>{femalePct}%</div>
                <div style={{ fontSize: "12px", color: S.text2, marginTop: "3px" }}>여성</div>
              </div>
              <div style={{ width: "0.5px", height: "48px", background: S.surface3 }} />
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "28px", fontWeight: 600, color: S.text }}>{malePct}%</div>
                <div style={{ fontSize: "12px", color: S.text2, marginTop: "3px" }}>남성</div>
              </div>
            </div>
            <div style={{ height: "8px", background: S.surface3, borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${femalePct}%`, background: S.blue, borderRadius: "4px" }} />
            </div>
          </Card>
          <Card title="연령대 분포">
            {ageBreakdown.map(a => (
              <BarRow key={a.age} label={a.age} value={a.female + a.male} max={maxAge} color={S.accent} suffix="%" />
            ))}
          </Card>
        </div>

        <Card title="성별×연령대 — 평균 결제금액">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr>
                {["연령대", "여성", "남성"].map(h => (
                  <th key={h} style={{ padding: "7px 10px", background: S.surface2, color: S.text3, fontWeight: 500, textAlign: "center", border: `0.5px solid ${S.surface3}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ageBreakdown.map(a => {
                const fAmt = Math.round((a.female / 10) * 8000 + 8000)
                const mAmt = Math.round((a.male / 10) * 10000 + 9000)
                return (
                  <tr key={a.age}>
                    <td style={{ padding: "7px 10px", textAlign: "center", border: `0.5px solid ${S.surface3}`, fontWeight: 600, color: S.text }}>{a.age}</td>
                    <td style={{ padding: "7px 10px", textAlign: "center", border: `0.5px solid ${S.surface3}`, color: S.blue, background: `rgba(88,166,255,${a.female / 50 * 0.15})` }}>{fAmt.toLocaleString()}원</td>
                    <td style={{ padding: "7px 10px", textAlign: "center", border: `0.5px solid ${S.surface3}`, color: S.green, background: `rgba(35,209,139,${a.male / 40 * 0.15})` }}>{mAmt.toLocaleString()}원</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card title="연령대별 인기 메뉴 TOP3">
          {Object.entries(AGE_MENU).map(([age, menus]) => (
            <div key={age} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: S.border }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: S.text, minWidth: "40px" }}>{age}</div>
              <div style={{ display: "flex", gap: "6px" }}>
                {menus.map((m, i) => (
                  <span key={m} style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", background: [S.blueBg, S.amberBg, S.greenBg][i], color: [S.blue, S.amber, S.green][i] }}>
                    {i + 1}. {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Card>
      </div>
    )
  }

  const TabStore = () => {
    if (!stats) return null
    const maxReview = Math.max(...stats.storeRanking.map(s => s.reviews))
    const maxAmt = Math.max(...stats.storeRanking.map(s => s.avgAmount))
    const STORE_TARGET = [
      { store: stats.storeRanking[0]?.name || "-", main: "20대 여성 (62%)", tag: "커플·친구", color: S.accent },
      { store: stats.storeRanking[1]?.name || "-", main: "30대 남성 (54%)", tag: "직장인·회식", color: S.green },
      { store: stats.storeRanking[2]?.name || "-", main: "20대 여성 (71%)", tag: "카공·미팅", color: S.amber },
      { store: stats.storeRanking[3]?.name || "-", main: "30대 남성 (67%)", tag: "회식·술자리", color: S.red },
      { store: stats.storeRanking[4]?.name || "-", main: "20대 여성 (68%)", tag: "브런치·데이트", color: S.blue },
    ]
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Card title="매장별 타겟 고객 분석">
          {STORE_TARGET.map(s => (
            <div key={s.store} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: S.border }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: S.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.store}</div>
              <div style={{ fontSize: "12px", color: S.text2 }}>{s.main}</div>
              <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: S.surface2, color: S.text3, whiteSpace: "nowrap" }}>{s.tag}</span>
            </div>
          ))}
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Card title="매장별 리뷰 수 TOP 5">
            {stats.storeRanking.slice(0, 5).map(s => (
              <BarRow key={s.name} label={s.name} value={s.reviews} max={maxReview} color={S.blue} />
            ))}
          </Card>
          <Card title="매장별 평균 결제금액">
            {stats.storeRanking.slice(0, 5).map(s => (
              <BarRow key={s.name} label={s.name} value={Math.round(s.avgAmount / 1000)} max={Math.round(maxAmt / 1000)} color={S.green} suffix="천" />
            ))}
          </Card>
        </div>
      </div>
    )
  }

  const TabTime = () => {
    if (!stats) return null
    const maxHour = Math.max(...stats.hourlyData)
    const maxDow = Math.max(...stats.dowData.map(d => d.count))
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Card title="시간대별 리뷰 히트맵 (0시~23시)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(24,1fr)", gap: "2px", marginBottom: "6px" }}>
            {stats.hourlyData.map((v, i) => {
              const alpha = 0.1 + (v / maxHour) * 0.85
              return (
                <div key={i} title={`${i}시: ${v}건`}
                  style={{ height: "24px", borderRadius: "3px", background: `rgba(88,166,255,${alpha})`, cursor: "pointer", transition: "transform .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scaleY(1.3)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scaleY(1)")}
                />
              )
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: S.text3 }}>
            {["0시", "6시", "12시", "18시", "23시"].map(t => <span key={t}>{t}</span>)}
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Card title="요일별 리뷰 분포">
            {stats.dowData.map((d, i) => (
              <BarRow key={d.day} label={`${d.day}요일`} value={d.count} max={maxDow} color={i >= 5 ? S.amber : S.surface3.replace("surface3", "text3")} />
            ))}
          </Card>
          <Card title="피크타임 인사이트">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { bg: S.amberBg, color: S.amber, title: "점심 피크 12~13시", desc: "전체 리뷰의 24% 집중\n20대 여성 비율 71%로 가장 높음" },
                { bg: S.blueBg, color: S.blue, title: "저녁 피크 18~20시", desc: "평균 결제금액 최고\n30대 남성 비율 높음, 평균 34,200원" },
                { bg: S.greenBg, color: S.green, title: "주말 브런치 10~11시", desc: "성장률 +38%\n20대 커플 방문 비율 높음" },
              ].map(({ bg, color, title, desc }) => (
                <div key={title} style={{ background: bg, borderRadius: S.radius, padding: "10px 12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color, marginBottom: "4px" }}>{title}</div>
                  <div style={{ fontSize: "11px", color, opacity: 0.8, whiteSpace: "pre-line", lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const TabAI = () => {
    const QUICK = ["20대 여성이 가장 많이 가는 매장은?", "새로운 BM을 제안해줘", "이번달 매출 예측해줘", "어떤 매장을 더 유치하면 좋을까?"]
    return (
      <div style={{ background: S.surface, border: S.border, borderRadius: S.radiusLg, padding: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: S.text, marginBottom: "14px" }}>
          AI 인사이트 — 데이터 기반 자동 분석
        </div>

        {/* 채팅창 */}
        <div ref={chatRef} style={{ height: "360px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px", paddingRight: "4px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
              {m.role === "assistant" && (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: S.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, color: S.accent, flexShrink: 0 }}>AI</div>
              )}
              <div style={{ maxWidth: "75%", padding: "10px 13px", borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px", background: m.role === "user" ? S.accentBg : S.surface2, color: m.role === "user" ? S.accent : S.text, fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {m.content}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: S.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, color: S.accent, flexShrink: 0 }}>AI</div>
              <div style={{ padding: "12px 16px", borderRadius: "4px 12px 12px 12px", background: S.surface2, display: "flex", gap: "4px", alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: S.text3, animation: `blink 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 빠른 질문 버튼 */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              style={{ padding: "5px 12px", fontSize: "11px", borderRadius: "20px", border: S.border2, background: S.surface2, color: S.text2, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = S.accentBg; (e.currentTarget as HTMLButtonElement).style.color = S.accent }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = S.surface2; (e.currentTarget as HTMLButtonElement).style.color = S.text2 }}>
              {q}
            </button>
          ))}
        </div>

        {/* 입력창 */}
        <div style={{ display: "flex", gap: "8px" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="데이터에 대해 무엇이든 물어보세요..."
            style={{ flex: 1, padding: "9px 12px", borderRadius: "8px", border: S.border2, background: S.surface2, color: S.text, fontSize: "13px", outline: "none", fontFamily: "inherit" }} />
          <button onClick={() => sendMessage()} disabled={aiLoading}
            style={{ padding: "9px 16px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.accent}`, background: S.accentBg, color: S.accent, cursor: "pointer", opacity: aiLoading ? 0.5 : 1 }}>
            전송
          </button>
        </div>

        <style>{`@keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }`}</style>
      </div>
    )
  }

  // ── 메인 렌더 ──────────────────────────────────────
  return (
    <div style={{ padding: "24px", background: S.bg, minHeight: "100vh", fontFamily: "inherit" }}>

      <div style={{ fontSize: "18px", fontWeight: 700, color: S.text, marginBottom: "20px" }}>AI 인사이트</div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: "6px", borderBottom: S.border2, marginBottom: "20px" }}>
        {([
          { key: "overview", label: "종합 현황" },
          { key: "demo", label: "성별·연령 분석" },
          { key: "store", label: "매장 분석" },
          { key: "time", label: "시간대 분석" },
          { key: "ai", label: "AI 채팅" },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "8px 16px", fontSize: "13px", cursor: "pointer", border: "none", background: "none", color: tab === key ? S.text : S.text3, fontWeight: tab === key ? 600 : 400, borderBottom: tab === key ? `2px solid ${S.accent}` : "2px solid transparent", marginBottom: "-0.5px", fontFamily: "inherit", transition: "all .15s" }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: S.text3, fontSize: "13px" }}>데이터 분석 중...</div>
      ) : (
        <>
          {tab === "overview" && <TabOverview />}
          {tab === "demo" && <TabDemo />}
          {tab === "store" && <TabStore />}
          {tab === "time" && <TabTime />}
          {tab === "ai" && <TabAI />}
        </>
      )}
    </div>
  )
}

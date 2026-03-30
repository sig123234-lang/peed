"use client"
import { useEffect, useState } from "react"

// ── 타입 ──────────────────────────────────────────
type Prize = {
  id: number
  name: string
  emoji: string
  value: number         // 원 단위
  stock: number
  totalGiven: number    // 지금까지 증정된 수
  drawCount: number     // 추첨에 사용된 횟수
  active: boolean
  createdAt: string
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

const inp: React.CSSProperties = {
  padding: "8px 10px", borderRadius: "8px",
  border: "0.5px solid rgba(255,255,255,0.1)",
  background: S.surface2, color: S.text, fontSize: "13px",
  outline: "none", width: "100%", fontFamily: "inherit",
}

const DEFAULT_FORM = { name: "", emoji: "🎁", value: "", stock: "", active: true }
const EMOJI_PRESETS = ["🎧","☕","🛍️","🍗","🎵","📱","💻","🎮","🍕","✈️","🏨","🎁","💐","🍰","🎯","🎬","👟","👜","⌚","💎"]

export default function AdminPrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const load = () => {
    setLoading(true)
    fetch("/api/admin/prizes")
      .then(r => r.json())
      .then(d => setPrizes(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // ── API ───────────────────────────────────────────
  const submit = async () => {
    if (!form.name.trim()) return showToast("경품 이름을 입력해주세요", false)
    if (!form.value || isNaN(Number(form.value))) return showToast("금액을 올바르게 입력해주세요", false)
    if (!form.stock || isNaN(Number(form.stock))) return showToast("재고를 올바르게 입력해주세요", false)

    const body = {
      name: form.name.trim(),
      emoji: form.emoji,
      value: Number(form.value),
      stock: Number(form.stock),
      active: form.active,
    }

    if (editId !== null) {
      const res = await fetch("/api/admin/prizes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, ...body }),
      })
      if (!res.ok) return showToast("수정 실패", false)
      showToast("수정 완료!")
    } else {
      const res = await fetch("/api/admin/prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) return showToast("등록 실패", false)
      showToast("경품 등록 완료!")
    }

    setForm(DEFAULT_FORM)
    setEditId(null)
    setShowForm(false)
    load()
  }

  const handleEdit = (p: Prize) => {
    setForm({ name: p.name, emoji: p.emoji, value: String(p.value), stock: String(p.stock), active: p.active })
    setEditId(p.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id: number) => {
    if (!confirm("경품을 삭제할까요? 연결된 추첨 기록이 있을 수 있어요.")) return
    const res = await fetch(`/api/admin/prizes?id=${id}`, { method: "DELETE" })
    if (!res.ok) return showToast("삭제 실패", false)
    showToast("삭제 완료")
    load()
  }

  const toggleActive = async (p: Prize) => {
    await fetch("/api/admin/prizes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active }),
    })
    setPrizes(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
  }

  const updateStock = async (p: Prize, delta: number) => {
    const newStock = Math.max(0, p.stock + delta)
    await fetch("/api/admin/prizes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, stock: newStock }),
    })
    setPrizes(prev => prev.map(x => x.id === p.id ? { ...x, stock: newStock } : x))
  }

  // ── KPI ───────────────────────────────────────────
  const totalGiven = prizes.reduce((a, p) => a + p.totalGiven, 0)
  const totalValue = prizes.reduce((a, p) => a + p.value * p.totalGiven, 0)
  const lowStock = prizes.filter(p => p.active && p.stock <= 2)

  // ── 렌더 ─────────────────────────────────────────
  return (
    <div style={{ padding: "24px", background: S.bg, minHeight: "100vh", fontFamily: "inherit" }}>

      {/* 토스트 */}
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 999, background: toast.ok ? S.green : S.red, color: "#fff", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600 }}>
          {toast.ok ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: S.text }}>경품 관리</div>
          <div style={{ fontSize: "12px", color: S.text3, marginTop: "3px" }}>총 {prizes.length}개 경품</div>
        </div>
        <button onClick={() => { setForm(DEFAULT_FORM); setEditId(null); setShowForm(v => !v) }}
          style={{ padding: "8px 16px", borderRadius: "8px", border: `0.5px solid ${S.accent}`, background: S.accentBg, color: S.accent, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          {showForm && editId === null ? "취소" : "+ 경품 추가"}
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "20px" }}>
        {[
          { label: "활성 경품", value: `${prizes.filter(p => p.active).length}개` },
          { label: "총 증정 수", value: `${totalGiven}건`, color: S.green },
          { label: "총 경품 가치", value: `${Math.round(totalValue / 10000)}만원`, color: S.accent },
          { label: "재고 부족", value: `${lowStock.length}개`, color: lowStock.length > 0 ? S.red : S.text3, sub: lowStock.length > 0 ? "2개 이하" : "이상 없음" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ background: S.surface2, borderRadius: "10px", padding: "14px 16px" }}>
            <div style={{ fontSize: "12px", color: S.text3, marginBottom: "6px" }}>{label}</div>
            <div style={{ fontSize: "22px", fontWeight: 600, color: color || S.text }}>{value}</div>
            {sub && <div style={{ fontSize: "11px", color: S.text3, marginTop: "3px" }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* 재고 부족 알림 */}
      {lowStock.length > 0 && (
        <div style={{ background: S.redBg, border: `0.5px solid ${S.red}44`, borderRadius: S.radiusLg, padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: S.red }}>
          ⚠ 재고 부족 경품: {lowStock.map(p => `${p.emoji} ${p.name} (${p.stock}개)`).join(", ")}
        </div>
      )}

      {/* 경품 등록/수정 폼 */}
      {showForm && (
        <div style={{ background: S.surface, border: S.border2, borderRadius: S.radiusLg, padding: "18px", marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: S.text, marginBottom: "14px" }}>
            {editId !== null ? "경품 수정" : "새 경품 등록"}
          </div>

          {/* 이모지 선택 */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", color: S.text3, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>아이콘</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button onClick={() => setShowEmojiPicker(v => !v)}
                style={{ fontSize: "26px", padding: "8px 12px", borderRadius: "8px", border: S.border2, background: S.surface2, cursor: "pointer", lineHeight: 1 }}>
                {form.emoji}
              </button>
              <span style={{ fontSize: "12px", color: S.text3 }}>클릭해서 변경</span>
            </div>
            {showEmojiPicker && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px", padding: "10px", background: S.surface2, borderRadius: "8px" }}>
                {EMOJI_PRESETS.map(e => (
                  <button key={e} onClick={() => { setForm(f => ({ ...f, emoji: e })); setShowEmojiPicker(false) }}
                    style={{ fontSize: "22px", padding: "6px", borderRadius: "6px", border: form.emoji === e ? `1px solid ${S.accent}` : "1px solid transparent", background: form.emoji === e ? S.accentBg : "transparent", cursor: "pointer" }}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", color: S.text3, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>경품 이름 *</div>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 에어팟 프로" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: "11px", color: S.text3, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>금액 (원) *</div>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="329000" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: "11px", color: S.text3, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>재고 수량 *</div>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="5" style={inp} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{ fontSize: "12px", color: S.text2 }}>활성 상태</div>
            <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              style={{ padding: "5px 12px", borderRadius: "20px", border: `0.5px solid ${form.active ? S.green : S.text3}`, background: form.active ? S.greenBg : S.surface2, color: form.active ? S.green : S.text3, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              {form.active ? "활성" : "비활성"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(DEFAULT_FORM) }}
              style={{ flex: 1, padding: "10px", fontSize: "13px", borderRadius: "8px", border: S.border2, background: S.surface2, color: S.text2, cursor: "pointer" }}>
              취소
            </button>
            <button onClick={submit}
              style={{ flex: 2, padding: "10px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: `0.5px solid ${S.accent}`, background: S.accentBg, color: S.accent, cursor: "pointer" }}>
              {editId !== null ? "수정 완료" : "등록하기"}
            </button>
          </div>
        </div>
      )}

      {/* 경품 목록 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: S.text3, fontSize: "13px" }}>로딩 중...</div>
      ) : prizes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <div style={{ fontSize: "32px", opacity: 0.3, marginBottom: "10px" }}>🎁</div>
          <div style={{ fontSize: "14px", color: S.text3 }}>아직 등록된 경품이 없어요</div>
          <div style={{ fontSize: "12px", color: S.text3, marginTop: "5px" }}>위 버튼으로 첫 경품을 추가해보세요</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {prizes.map(p => (
            <div key={p.id}
              style={{ background: S.surface, border: p.stock <= 2 && p.active ? `0.5px solid ${S.red}44` : S.border, borderRadius: S.radiusLg, padding: "16px", opacity: p.active ? 1 : 0.55, transition: "opacity .15s" }}>

              {/* 헤더 */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ fontSize: "28px", lineHeight: 1 }}>{p.emoji}</div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: S.text, marginBottom: "2px" }}>{p.name}</div>
                    <div style={{ fontSize: "12px", color: S.text3 }}>{p.value.toLocaleString()}원</div>
                  </div>
                </div>
                <button onClick={() => toggleActive(p)}
                  style={{ fontSize: "11px", padding: "3px 9px", borderRadius: "20px", border: `0.5px solid ${p.active ? S.green : S.text3}`, background: p.active ? S.greenBg : S.surface2, color: p.active ? S.green : S.text3, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {p.active ? "활성" : "비활성"}
                </button>
              </div>

              {/* 재고 조절 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: S.surface2, borderRadius: "8px", padding: "10px 12px", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: S.text3, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "2px" }}>재고</div>
                  <div style={{ fontSize: "20px", fontWeight: 600, color: p.stock <= 2 ? S.red : p.stock <= 5 ? S.amber : S.green }}>{p.stock}개</div>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button onClick={() => updateStock(p, -1)}
                    style={{ width: "28px", height: "28px", borderRadius: "50%", border: S.border2, background: S.surface, color: S.text2, fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>−</button>
                  <button onClick={() => updateStock(p, 1)}
                    style={{ width: "28px", height: "28px", borderRadius: "50%", border: S.border2, background: S.surface, color: S.text2, fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>+</button>
                </div>
              </div>

              {/* 통계 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
                <div style={{ background: S.surface2, borderRadius: "6px", padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: S.text3, marginBottom: "2px", textTransform: "uppercase" }}>총 증정</div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: S.accent }}>{p.totalGiven}건</div>
                </div>
                <div style={{ background: S.surface2, borderRadius: "6px", padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: S.text3, marginBottom: "2px", textTransform: "uppercase" }}>추첨 사용</div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: S.blue }}>{p.drawCount}회</div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => handleEdit(p)}
                  style={{ flex: 1, padding: "7px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", border: S.border2, background: S.surface2, color: S.text2, cursor: "pointer" }}>
                  수정
                </button>
                <button onClick={() => handleDelete(p.id)}
                  style={{ flex: 1, padding: "7px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", border: `0.5px solid ${S.red}44`, background: S.redBg, color: S.red, cursor: "pointer" }}>
                  삭제
                </button>
              </div>

              {/* 재고 부족 경고 */}
              {p.active && p.stock <= 2 && (
                <div style={{ marginTop: "8px", fontSize: "11px", color: S.red, textAlign: "center" }}>
                  ⚠ 재고 {p.stock <= 0 ? "소진" : "부족"} — 보충 필요
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

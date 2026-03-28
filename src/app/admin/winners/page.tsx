"use client"
import { useEffect, useState } from "react"

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)

  const fetchWinners = () => {
    fetch("/api/admin/winners").then(r => r.json()).then(d => setWinners(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchWinners() }, [])

  const handleDraw = async () => {
    setDrawing(true)
    const res = await fetch("/api/admin/draw", { method:"POST" })
    const data = await res.json()
    if (data.results?.length > 0) {
      alert(`추첨 완료! ${data.results.map((r: any) => `${r.prizeName}: ${r.winners}명`).join(", ")}`)
      fetchWinners()
    } else {
      alert("추첨할 경품이 없거나 아직 추첨 시간이 아닙니다")
    }
    setDrawing(false)
  }

  return (
    <div style={{ padding:"24px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <div style={{ fontSize:"18px", fontWeight:"700", color:"#1A1F36" }}>당첨 내역</div>
          <div style={{ fontSize:"12px", color:"#9CA3AF", marginTop:"2px" }}>경품 추첨 결과 및 당첨자 정보를 확인합니다</div>
        </div>
        <button onClick={handleDraw} disabled={drawing}
          style={{ padding:"8px 16px", background: drawing ? "#C4B5FD" : "#4A6CF7", color:"#fff", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"600", cursor: drawing ? "not-allowed" : "pointer" }}>
          {drawing ? "추첨 중..." : "지금 추첨하기"}
        </button>
      </div>

      <div style={{ background:"#EEF2FF", border:"1px solid #E5E9FF", borderRadius:"10px", padding:"12px 16px", marginBottom:"20px", fontSize:"12px", color:"#4A6CF7" }}>
        추첨 시간(drawAt)이 지난 경품은 "지금 추첨하기" 버튼을 누르면 자동으로 당첨자가 선정됩니다
      </div>

      <div style={{ background:"#fff", border:"1px solid #E5E9FF", borderRadius:"12px", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #E5E9FF" }}>
              {["경품", "당첨자", "연락처", "고유번호", "추첨일"].map(h => (
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:"11px", fontWeight:"700", color:"#9CA3AF", letterSpacing:"0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"#9CA3AF" }}>로딩 중...</td></tr>
            ) : winners.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"#9CA3AF" }}>당첨 내역이 없습니다</td></tr>
            ) : winners.map(w => (
              <tr key={w.id} style={{ borderBottom:"1px solid #F5F7FF" }}>
                <td style={{ padding:"14px 16px" }}>
                  <div style={{ fontSize:"13px", fontWeight:"600", color:"#1A1F36" }}>{w.prize?.emoji} {w.prize?.name}</div>
                  <div style={{ fontSize:"11px", color:"#9CA3AF", marginTop:"2px" }}>{w.prize?.value}</div>
                </td>
                <td style={{ padding:"14px 16px" }}>
                  <div style={{ fontSize:"13px", fontWeight:"600", color:"#1A1F36" }}>{w.user?.name ?? "-"}</div>
                  <div style={{ fontSize:"11px", color:"#9CA3AF", marginTop:"2px" }}>{w.user?.email}</div>
                </td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color: w.user?.phoneNumber ? "#1A1F36" : "#9CA3AF" }}>
                  {w.user?.phoneNumber ?? "미등록"}
                </td>
                <td style={{ padding:"14px 16px" }}>
                  <span style={{ background:"#F1F5F9", color:"#475569", borderRadius:"6px", padding:"2px 8px", fontSize:"12px", fontWeight:"700", fontFamily:"monospace" }}>
                    {w.user?.referralCode?.slice(0,8).toUpperCase() ?? "-"}
                  </span>
                </td>
                <td style={{ padding:"14px 16px", fontSize:"13px", color:"#9CA3AF" }}>
                  {new Date(w.createdAt).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
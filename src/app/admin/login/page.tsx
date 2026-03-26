"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!id || !password) { setError("아이디와 비밀번호를 입력해주세요"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      })
      if (res.ok) {
        router.push("/admin")
      } else {
        const data = await res.json()
        setError(data.error || "로그인 실패")
      }
    } catch {
      setError("네트워크 오류가 발생했어요")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: "24px", padding: "40px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(108,92,231,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#6C5CE7", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "24px", fontWeight: "900", color: "#fff" }}>P</span>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "900", color: "#1A1F36", margin: "0 0 4px" }}>PEED 어드민</h1>
          <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>관리자 로그인</p>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>아이디</label>
          <input
            value={id}
            onChange={e => setId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="관리자 아이디"
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E5E9FF", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#555", display: "block", marginBottom: "6px" }}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="관리자 비밀번호"
            style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #E5E9FF", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {error && (
          <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#DC2626" }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: loading ? "#C4B5FD" : "#6C5CE7", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </div>
    </div>
  )
}
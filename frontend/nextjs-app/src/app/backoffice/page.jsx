"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://minkowskim.com";

const defaultRows = [
  { id: "gateway", name: "API Gateway", path: "/actuator/health", status: null, message: "" },
  { id: "post", name: "Post 서비스", path: "/api/posts?size=1", status: null, message: "" },
  { id: "search", name: "Search 서비스", path: "/api/search?q=test&limit=2", status: null, message: "" },
  { id: "chat", name: "Chat 서비스", path: "/chat/health", status: null, message: "" },
];

function checkGatewayHealth() {
  return fetch(`${API_BASE}/actuator/health`, { credentials: "include" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => ({ status: data?.status ?? (data ? "UP" : null), message: data?.status ?? "" }));
}

function checkPostService() {
  return fetch(`${API_BASE}/api/posts?size=1`, { credentials: "include" })
    .then((res) => (res.ok ? "UP" : null))
    .catch(() => null)
    .then((status) => ({ status: status ?? "DOWN", message: status ? "목록 조회 성공" : "연결 실패" }));
}

function checkSearchService() {
  return fetch(`${API_BASE}/api/search?q=test&limit=2`, { credentials: "include" })
    .then((res) => (res.ok ? "UP" : null))
    .catch(() => null)
    .then((status) => ({ status: status ?? "DOWN", message: status ? "검색 API 정상" : "연결 실패" }));
}

function checkChatService() {
  return fetch(`${API_BASE.replace(/\/$/, "")}/chat/health`, { credentials: "include" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => (data?.status === "ok" ? "UP" : null))
    .catch(() => null)
    .then((status) => ({ status: status ?? "DOWN", message: status ? "챗봇 서비스 정상" : "연결 실패" }));
}

export default function BackofficePage() {
  const [rows, setRows] = useState(defaultRows);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const runChecks = () => {
    setLoading(true);
    const base = API_BASE.replace(/\/$/, "");

    Promise.all([
      checkGatewayHealth(),
      checkPostService(),
      checkSearchService(),
      checkChatService(),
    ])
      .then(([g, p, s, c]) => {
        setRows([
          { id: "gateway", name: "API Gateway", path: "/actuator/health", status: g?.status ?? null, message: g?.message ?? "" },
          { id: "post", name: "Post 서비스", path: "/api/posts?size=1", status: p?.status ?? null, message: p?.message ?? "" },
          { id: "search", name: "Search 서비스", path: "/api/search?q=test&limit=2", status: s?.status ?? null, message: s?.message ?? "" },
          { id: "chat", name: "Chat 서비스", path: "/chat/health", status: c?.status ?? null, message: c?.message ?? "" },
        ]);
        setLastChecked(new Date().toLocaleTimeString("ko-KR"));
      })
      .catch(() => setRows(defaultRows))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    runChecks();
  }, []);

  return (
    <div className="backoffice-page" style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ marginBottom: "1.5rem", color: "var(--color-text-main)" }}>
        관리자 · 모니터링
      </h1>

      <section style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1.25rem", margin: 0 }}>시스템 동작 상태</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {lastChecked && (
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-sub)" }}>
                마지막 확인: {lastChecked}
              </span>
            )}
            <button
              type="button"
              className="btn-primary-small"
              onClick={runChecks}
              disabled={loading}
            >
              {loading ? "확인 중…" : "다시 확인"}
            </button>
          </div>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid var(--color-border)",
          }}
        >
          <thead>
            <tr style={{ background: "var(--color-secondary)" }}>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>서비스</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>상태</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: "0.75rem" }}>{r.name}</td>
                <td style={{ padding: "0.75rem" }}>
                  {loading && r.status == null ? (
                    <span style={{ color: "var(--color-text-sub)" }}>확인 중…</span>
                  ) : r.status === "UP" || r.status === "up" ? (
                    <span style={{ color: "var(--color-success)", fontWeight: 600 }}>정상</span>
                  ) : (
                    <span style={{ color: "var(--color-error)" }}>오류</span>
                  )}
                </td>
                <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "var(--color-text-sub)" }}>
                  {r.message || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--color-text-sub)" }}>
          Gateway 경유로 각 서비스 연결을 확인합니다. 상세 로그·메트릭은 Grafana(Loki)에서 확인하세요.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>모니터링 링크</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <a
              href="/grafana/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-accent)" }}
            >
              Grafana 대시보드 (Loki 로그)
            </a>
            <span style={{ marginLeft: "0.5rem", color: "var(--color-text-sub)", fontSize: "0.875rem" }}>
              — <code>docker compose --profile monitoring up -d</code> 기동 후 접속
            </span>
          </li>
        </ul>
      </section>

      <p style={{ marginTop: "2rem" }}>
        <Link href="/" style={{ color: "var(--color-accent)" }}>← 목록으로</Link>
      </p>
    </div>
  );
}

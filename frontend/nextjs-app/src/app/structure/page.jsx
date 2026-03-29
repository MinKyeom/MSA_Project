"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { fetchPosts } from "../../services/api/posts";
import PostCard from "../../components/Post/PostCard";
import "../../styles/StructurePage.css";

/**
 * MSA 아키텍처 노드: 클릭 시 해당 영역 관련 포스트 검색 (OR 조건)
 */
const ARCH_NODES = [
  {
    id: "https",
    label: "HTTPS (443)",
    sub: "minkowskim.com / dev.minkowskim.com",
    searchTerms: [{ type: "tag", value: "ssl" }, { type: "tag", value: "https" }],
    searchQuery: "ssl https",
  },
  {
    id: "nginx",
    label: "Nginx",
    sub: "리버스 프록시 · / → Next.js │ /auth,/user,/api,/chat → Gateway",
    searchTerms: [{ type: "tag", value: "nginx" }, { type: "tag", value: "lightsail" }],
    searchQuery: "nginx lightsail",
  },
  {
    id: "nextjs",
    label: "Next.js (Frontend)",
    sub: "App Router, API 클라이언트",
    searchTerms: [{ type: "category", value: "frontend" }, { type: "tag", value: "nextjs" }, { type: "tag", value: "react" }],
    searchQuery: "frontend nextjs react",
  },
  {
    id: "gateway",
    label: "Spring Cloud Gateway",
    sub: "JWT 검증 · 라우팅 · Trace ID",
    searchTerms: [{ type: "tag", value: "gateway" }, { type: "tag", value: "spring-cloud" }],
    searchQuery: "gateway spring cloud",
  },
  {
    id: "auth",
    label: "Auth",
    sub: "Spring Boot",
    searchTerms: [{ type: "tag", value: "auth" }, { type: "tag", value: "spring" }, { type: "tag", value: "jwt" }],
    searchQuery: "auth spring jwt",
  },
  {
    id: "user",
    label: "User",
    sub: "Spring Boot",
    searchTerms: [{ type: "tag", value: "user" }, { type: "tag", value: "spring" }],
    searchQuery: "user spring",
  },
  {
    id: "post",
    label: "Post",
    sub: "Spring Boot",
    searchTerms: [{ type: "tag", value: "post" }, { type: "tag", value: "spring" }],
    searchQuery: "post spring",
  },
  {
    id: "search",
    label: "Search",
    sub: "FastAPI · pgvector",
    searchTerms: [{ type: "tag", value: "search" }, { type: "tag", value: "fastapi" }, { type: "tag", value: "pgvector" }],
    searchQuery: "search fastapi pgvector",
  },
  {
    id: "ai",
    label: "FastAPI AI",
    sub: "FastAPI · Groq / Redis",
    searchTerms: [{ type: "tag", value: "ai" }, { type: "tag", value: "fastapi" }, { type: "tag", value: "redis" }],
    searchQuery: "ai fastapi redis",
  },
  {
    id: "mail",
    label: "Mail (SMTP)",
    sub: "Spring · Kafka 구독",
    searchTerms: [{ type: "tag", value: "mail" }, { type: "tag", value: "kafka" }, { type: "tag", value: "smtp" }],
    searchQuery: "mail kafka smtp",
  },
  {
    id: "db-auth",
    label: "db-auth",
    sub: "PostgreSQL",
    searchTerms: [{ type: "tag", value: "postgresql" }, { type: "tag", value: "database" }],
    searchQuery: "postgresql database",
  },
  {
    id: "db-user",
    label: "db-user",
    sub: "PostgreSQL",
    searchTerms: [{ type: "tag", value: "postgresql" }, { type: "tag", value: "database" }],
    searchQuery: "postgresql database",
  },
  {
    id: "db-post",
    label: "db-post",
    sub: "PostgreSQL",
    searchTerms: [{ type: "tag", value: "postgresql" }, { type: "tag", value: "database" }],
    searchQuery: "postgresql database",
  },
  {
    id: "db-search",
    label: "db-search",
    sub: "pgvector",
    searchTerms: [{ type: "tag", value: "pgvector" }, { type: "tag", value: "database" }],
    searchQuery: "pgvector database",
  },
  {
    id: "redis",
    label: "Redis",
    sub: "세션 / 캐시",
    searchTerms: [{ type: "tag", value: "redis" }],
    searchQuery: "redis",
  },
  {
    id: "kafka",
    label: "Kafka (KRaft)",
    sub: "메시지 브로커",
    searchTerms: [{ type: "tag", value: "kafka" }],
    searchQuery: "kafka",
  },
];

/** 노드 순서: 데이터 흐름 시뮬레이션용 (staggered glow) */
const FLOW_ORDER = ["https", "nginx", "nextjs", "gateway", "auth", "user", "post", "search", "ai", "mail", "db-auth", "db-user", "db-post", "db-search", "redis", "kafka"];

function mergePostsByTermResults(termResults) {
  const byId = new Map();
  for (const post of termResults) {
    const id = post?.id ?? post?.postId;
    if (id != null && !byId.has(id)) byId.set(id, { ...post, id: Number(id) });
  }
  return Array.from(byId.values());
}

export default function StructurePage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const handleNodeClick = useCallback(async (node) => {
    setSelectedNode(node);
    setLoading(true);
    setPosts([]);
    try {
      const promises = (node.searchTerms || []).map((term) =>
        fetchPosts(
          0,
          8,
          term.type === "category" ? term.value : null,
          term.type === "tag" ? term.value : null
        )
      );
      if (promises.length === 0) {
        setPosts([]);
        return;
      }
      const results = await Promise.all(promises);
      const items = results.flatMap((r) => {
        const data = r?.content ?? r?.data?.content ?? (Array.isArray(r) ? r : []);
        return Array.isArray(data) ? data : [];
      });
      const merged = mergePostsByTermResults(items);
      setPosts(merged.slice(0, 12));
    } catch (err) {
      console.error("Failed to load posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchHref = selectedNode
    ? `/search?q=${encodeURIComponent(selectedNode.searchQuery || "")}`
    : "#";

  const nodeMap = Object.fromEntries(ARCH_NODES.map((n) => [n.id, n]));

  return (
    <div className="structure-page arch-page">
      <header className="structure-header">
        <h1 className="structure-title">System Architecture</h1>
        <p className="structure-description">
          Click a component to see related posts.
        </p>
      </header>

      <div className="arch-diagram" role="img" aria-label="MSA architecture diagram">
        {/* SVG: HTTPS(4) → Nginx(18) → Next/Gateway(28) — 상단 간격 넓게 */}
        <svg className="arch-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="archLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="var(--color-accent)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {/* HTTPS → Nginx */}
          <line x1="50" y1="9" x2="50" y2="22" className="arch-line" />
          <line x1="50" y1="9" x2="50" y2="22" className="arch-line-flow" />
          {/* Nginx → Next.js | Gateway */}
          <line x1="50" y1="22" x2="22" y2="32" className="arch-line" />
          <line x1="50" y1="22" x2="22" y2="32" className="arch-line-flow" style={{ animationDelay: "0.1s" }} />
          <line x1="50" y1="22" x2="78" y2="32" className="arch-line" />
          <line x1="50" y1="22" x2="78" y2="32" className="arch-line-flow" style={{ animationDelay: "0.2s" }} />
          {/* Gateway → 6 services (균등 간격 10,26,42,58,74,90) */}
          {[10, 26, 42, 58, 74, 90].map((x, i) => (
            <g key={i}>
              <line x1="78" y1="32" x2={x} y2="50" className="arch-line" />
              <line x1="78" y1="32" x2={x} y2="50" className="arch-line-flow" style={{ animationDelay: `${0.3 + i * 0.05}s` }} />
            </g>
          ))}
          {/* 서비스 → 각 DB/Redis/Kafka (직선) */}
          {[10, 26, 42, 58, 74, 90].map((x, i) => (
            <g key={`svc-db-${i}`}>
              <line x1={x} y1="50" x2={x} y2="76" className="arch-line" />
              <line x1={x} y1="50" x2={x} y2="76" className="arch-line-flow arch-line-flow-vert" style={{ animationDelay: `${0.65 + i * 0.05}s` }} />
            </g>
          ))}
          {/* Auth→Redis, Auth→Kafka, Post→Kafka, Kafka→User, Kafka→Mail, User→Redis */}
          <line x1="10" y1="50" x2="74" y2="76" className="arch-line arch-line-extra" />
          <line x1="10" y1="50" x2="74" y2="76" className="arch-line-flow" style={{ animationDelay: "0.7s" }} />
          <line x1="10" y1="50" x2="90" y2="76" className="arch-line arch-line-extra" />
          <line x1="10" y1="50" x2="90" y2="76" className="arch-line-flow" style={{ animationDelay: "0.72s" }} />
          <line x1="42" y1="50" x2="90" y2="76" className="arch-line arch-line-extra" />
          <line x1="42" y1="50" x2="90" y2="76" className="arch-line-flow" style={{ animationDelay: "0.74s" }} />
          <line x1="90" y1="76" x2="26" y2="50" className="arch-line arch-line-extra" />
          <line x1="90" y1="76" x2="26" y2="50" className="arch-line-flow" style={{ animationDelay: "0.78s" }} />
          <line x1="90" y1="76" x2="90" y2="50" className="arch-line arch-line-extra" />
          <line x1="90" y1="76" x2="90" y2="50" className="arch-line-flow arch-line-flow-vert" style={{ animationDelay: "0.8s" }} />
          <line x1="26" y1="50" x2="74" y2="76" className="arch-line arch-line-extra" />
          <line x1="26" y1="50" x2="74" y2="76" className="arch-line-flow" style={{ animationDelay: "0.73s" }} />
        </svg>

        {/* 레이어 0: HTTPS */}
        <div className="arch-layer arch-layer-0">
          <ArchNode
            node={nodeMap.https}
            flowIndex={FLOW_ORDER.indexOf("https")}
            isSelected={selectedNode?.id === "https"}
            onClick={() => handleNodeClick(nodeMap.https)}
          />
        </div>
        {/* 레이어 1: Nginx */}
        <div className="arch-layer arch-layer-1">
          <ArchNode
            node={nodeMap.nginx}
            flowIndex={FLOW_ORDER.indexOf("nginx")}
            isSelected={selectedNode?.id === "nginx"}
            onClick={() => handleNodeClick(nodeMap.nginx)}
          />
        </div>
        {/* 레이어 2: Next.js | Gateway */}
        <div className="arch-layer arch-layer-2">
          <ArchNode
            node={nodeMap.nextjs}
            flowIndex={FLOW_ORDER.indexOf("nextjs")}
            isSelected={selectedNode?.id === "nextjs"}
            onClick={() => handleNodeClick(nodeMap.nextjs)}
          />
          <ArchNode
            node={nodeMap.gateway}
            flowIndex={FLOW_ORDER.indexOf("gateway")}
            isSelected={selectedNode?.id === "gateway"}
            onClick={() => handleNodeClick(nodeMap.gateway)}
          />
        </div>
        {/* 레이어 3: 6 services */}
        <div className="arch-layer arch-layer-3">
          {["auth", "user", "post", "search", "ai", "mail"].map((id) => (
            <ArchNode
              key={id}
              node={nodeMap[id]}
              flowIndex={FLOW_ORDER.indexOf(id)}
              isSelected={selectedNode?.id === id}
              onClick={() => handleNodeClick(nodeMap[id])}
            />
          ))}
        </div>
        {/* 레이어 4: 6 data stores */}
        <div className="arch-layer arch-layer-4">
          {["db-auth", "db-user", "db-post", "db-search", "redis", "kafka"].map((id) => (
            <ArchNode
              key={id}
              node={nodeMap[id]}
              flowIndex={FLOW_ORDER.indexOf(id)}
              isSelected={selectedNode?.id === id}
              onClick={() => handleNodeClick(nodeMap[id])}
            />
          ))}
        </div>
      </div>

      {selectedNode && (
        <section className="structure-results" aria-live="polite">
          <h2 className="structure-results__title">
            Posts related to &ldquo;{selectedNode.label}&rdquo;
          </h2>
          {loading ? (
            <p className="structure-results__loading">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="structure-results__empty">
              No posts match this area yet.{" "}
              <Link href={searchHref} className="structure-results__link">
                Try search
              </Link>
            </p>
          ) : (
            <div className="structure-results__grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
          <p className="structure-results__more">
            <Link href={searchHref} className="structure-results__link">
              View all in search →
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}

function ArchNode({ node, flowIndex, isSelected, onClick }) {
  if (!node) return null;
  const delay = flowIndex >= 0 ? flowIndex * 0.45 : 0;
  return (
    <div
      className={`arch-node ${isSelected ? "is-selected" : ""}`}
      style={{ animationDelay: `${delay}s` }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${node.label}: ${node.sub || ""}`}
    >
      <div className="arch-node__label">{node.label}</div>
      {node.sub && <div className="arch-node__sub">{node.sub}</div>}
    </div>
  );
}

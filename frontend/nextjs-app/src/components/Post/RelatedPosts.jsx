"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchRelatedPosts } from "../../services/api/search";

export default function RelatedPosts({ postId }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    fetchRelatedPosts(Number(postId), 5).then((list) => {
      if (!cancelled) {
        setResults(Array.isArray(list) ? list : []);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [postId]);

  if (loading || results.length === 0) return null;

  return (
    <section
      className="related-posts"
      style={{
        marginTop: "2.5rem",
        paddingTop: "1.5rem",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--color-text-main)",
          marginBottom: "1rem",
        }}
      >
        연관 포스트
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {results.map((r) => (
          <li
            key={r.postId}
            style={{
              marginBottom: "0.75rem",
              padding: "0.5rem 0",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <Link
              href={`/post/${r.postId}`}
              style={{
                color: "var(--color-accent)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {r.title || `글 #${r.postId}`}
            </Link>
            {r.snippet && (
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.875rem",
                  color: "var(--color-text-sub)",
                }}
              >
                {r.snippet}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

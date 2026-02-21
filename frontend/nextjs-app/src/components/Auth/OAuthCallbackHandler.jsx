"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../providers/AuthProvider";
import { useToast } from "../../hooks/useToast";
import { fetchMe } from "../../services/api/user";

/**
 * OAuth 로그인 성공 후 리다이렉트(?oauth=success) 시 사용자 정보 동기화 및 토스트 표시.
 */
export default function OAuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const { showToast } = useToast();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const oauthSuccess = searchParams.get("oauth") === "success";
    if (!oauthSuccess) return;

    handled.current = true;

    const sync = async () => {
      try {
        const user = await fetchMe();
        if (user?.id) {
          if (typeof window !== "undefined") {
            localStorage.setItem("currentUserId", user.id);
            localStorage.setItem("currentUserNickname", user.nickname ?? user.username ?? "");
          }
          refreshAuth();
          showToast({ message: "소셜 로그인 성공!", type: "success" });
        }
      } catch (e) {
        console.error("OAuth callback sync error:", e);
        showToast({ message: "로그인 상태를 불러오는 데 실패했습니다.", type: "error" });
      } finally {
        router.replace("/", { scroll: false });
      }
    };

    sync();
  }, [searchParams, router, refreshAuth, showToast]);

  return null;
}

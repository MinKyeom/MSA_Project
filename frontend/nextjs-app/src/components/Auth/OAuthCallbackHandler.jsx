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
  const { setLoginState } = useAuth();
  const { showToast } = useToast();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const oauthSuccess = searchParams.get("oauth") === "success";
    if (!oauthSuccess) return;

    handled.current = true;

    const sync = async () => {
      const maxAttempts = 4;
      const delayMs = 600;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const user = await fetchMe();
          if (user?.id) {
            setLoginState(user);
            showToast({ message: "Logged in successfully.", type: "success" });
            router.replace("/", { scroll: false });
            return;
          }
        } catch (e) {
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, delayMs * attempt));
          } else {
            console.error("OAuth callback sync error:", e);
            showToast({ message: "Failed to load session.", type: "error" });
          }
        }
      }
      router.replace("/", { scroll: false });
    };

    sync();
  }, [searchParams, router, setLoginState, showToast]);

  return null;
}

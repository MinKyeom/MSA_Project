// app/(auth)/signin/page.jsx
// Next.js Signin Page (Server Component Wrapper)

import Link from "next/link";
import SignInForm from "../../../components/Auth/SignInForm";

// 🌟 수정: 한국어 우선 SEO 메타데이터 정의
export const metadata = {
  title: "Log in",
  description: "Log in to MinKowskiM to write posts and use all features.",
  alternates: {
    canonical: "https://minkowskim.com/signin",
  },
};

export default function SignInPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Log in</h1>

        <SignInForm />

        <div className="auth-link">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </div>
        <div className="auth-link" style={{ marginTop: "0.5rem" }}>
          <Link href="/find-username">Find username</Link>
          {" · "}
          <Link href="/find-password">Find password</Link>
        </div>
      </div>
    </div>
  );
}
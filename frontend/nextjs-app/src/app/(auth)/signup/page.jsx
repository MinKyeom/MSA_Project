// src/app/(auth)/signup/page.jsx
// Next.js Signup Page (Server Component)

import Link from "next/link";
import SignupForm from "../../../components/Auth/SignUpForm";

// 🌟 수정: 한국어 우선 SEO 메타데이터 (한국어 우선)
export const metadata = {
  title: "Sign up | MinKowskiM",
  description: "Create an account on MinKowskiM to write posts and use the chatbot.",
  alternates: {
    canonical: "https://minkowskim.com/signup",
  },
};

export default function SignUpPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Sign up</h1>
        <SignupForm />

        <div className="auth-link">
          Already have an account? <Link href="/signin">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
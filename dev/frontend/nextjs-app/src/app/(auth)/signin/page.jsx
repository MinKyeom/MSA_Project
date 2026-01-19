// app/(auth)/signin/page.jsx
// Next.js Signin Page (Server Component Wrapper)

import Link from "next/link";
import SignInForm from "../../../components/Auth/SignInForm"; 
import '../../../components/Auth/Signup.css'; 

// 🌟 수정: 한국어 우선 SEO 메타데이터 정의
export const metadata = {
  // 🌟 UI 텍스트 한국어 우선: 로그인
  title: "로그인", 
  // 🌟 UI 텍스트 한국어 우선: MinKowskiM 블로그에 로그인하여 글 작성 및 다양한 기능을 사용하세요.
  description: "MinKowskiM 블로그에 로그인하여 글 작성 및 다양한 기능을 사용하세요.",
  alternates: {
    canonical:
      "https://your-blog-url.com/signin",
  },
};

export default function SignInPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* 🌟 UI 텍스트 한국어 우선: 로그인 */}
        <h1 className="auth-title">로그인</h1>

        <SignInForm />

        <div className="auth-link">
          {/* 🌟 UI 텍스트 한국어 우선: 계정이 없으신가요? 회원가입 */}
          계정이 없으신가요? {" "}
          <Link href="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  );
}
// src/app/(auth)/signup/page.jsx
// Next.js Signup Page (Server Component)

import Link from "next/link";
import SignupForm from "../../../components/Auth/SignUpForm"; 
import '../../../components/Auth/Signup.css'; 

// 🌟 수정: 한국어 우선 SEO 메타데이터 (한국어 우선)
export const metadata = {
  // 🌟 UI 텍스트 한국어 우선: 회원가입
  title: '회원가입 | MinKowski',
  description: 'MinKowski에 가입하여 글을 작성하고 챗봇 기능을 사용해보세요.',
  alternates: {
    canonical: 'https://your-blog-url.com/signup',
  },
};

export default function SignUpPage() {
  return (
    <div className="auth-page"> 
      <div className="auth-container"> 
        {/* 🌟 UI 텍스트 한국어 우선: 회원가입 */}
        <h1 className="auth-title">회원가입</h1>
        <SignupForm />
        
        <div className="auth-link">
          {/* 🌟 UI 텍스트 한국어 우선: 이미 계정이 있으신가요? 로그인 */}
          이미 계정이 있으신가요? {" "}
          <Link href="/signin">로그인</Link>
        </div>
      </div>
    </div>
  );
}
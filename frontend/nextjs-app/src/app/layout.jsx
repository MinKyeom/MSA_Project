// app/layout.jsx (Server Component)
import { Montserrat, Nanum_Myeongjo, Caveat } from "next/font/google"; // Caveat 추가

import { ThemeProvider } from "../providers/ThemeProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { ToastProvider } from "../providers/ToastProvider";
import Header from "../components/common/Header";

import ChatbotWrapper from "../components/Chatbot/ChatbotWrapper";
import OAuthCallbackHandler from "../components/Auth/OAuthCallbackHandler";

// 전역 스타일 임포트
import "../styles/globals.css";
import "../styles/Header.css"; // 🌟 추가: Header.css 임포트
import "../components/Chatbot/Chatbot.css";
import "../styles/Toast.css";

//
// const sacramento = Sacramento({
//   weight: "400",
//   subsets: ["latin"],
//   variable: "--font-sacramento", // CSS 변수 이름 설정
// });

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat", // CSS에서 사용할 변수명 지정
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const nanumMyeongjo = Nanum_Myeongjo({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-myeongjo",
});

// 🌟 수정: 한국어 우선 SEO 메타데이터 업데이트
export const metadata = {
  // 🌟 한국어 기본 타이틀
  title: {
    default: "MinKowskiM | 구조적으로 사고하고, 시간을 초월하여 살다.",
    template: "%s | MinKowskiM",
  },
  // 🌟 한국어 상세 설명
  description:
    "백엔드, 프론트엔드, AI/ML을 아우르는 소프트웨어 개발 트렌드와 인사이트를 공유하는 개인 개발 블로그입니다.",
  keywords: [
    "Next.js",
    "React",
    "Spring Boot",
    "개발 블로그",
    "MinKowskiM",
    "기술 아카이브",
  ],
  alternates: {
    canonical: "https://your-blog-url.com",
    // 🌟 영문 대체 URL (선택적)
    languages: {
      "ko-KR": "https://your-blog-url.com",
      "en-US": "https://your-blog-url.com/en", // 영문 버전 URL이 있다면
    },
  },
  openGraph: {
    title: "MinKowskiM | 구조적으로 사고하고, 시간을 초월하여 살다.",
    description:
      "백엔드, 프론트엔드, AI/ML을 아우르는 소프트웨어 개발 트렌드와 인사이트를 공유하는 개인 개발 블로그입니다.",
    url: "https://your-blog-url.com",
    siteName: "MinKowskiM",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MinKowskiM",
    description:
      "백엔드, 프론트엔드, AI/ML을 아우르는 소프트웨어 개발 트렌드와 인사이트를 공유하는 개인 개발 블로그입니다.",
  },
};

// 프로바이더를 모아서 렌더링하는 헬퍼 컴포넌트 (Client Component만 포함)
const ProvidersWrapper = ({ children }) => (
  <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <OAuthCallbackHandler />
        {children}
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
);

export default function RootLayout({ children }) {
  return (
    // 🌟 수정: HTML 언어 코드를 'ko' (한국어)로 변경
    <html
      lang="ko"
      className={`${montserrat.variable} ${nanumMyeongjo.variable} ${caveat.variable}`}
    >
      <body>
        <ProvidersWrapper>
          <div className="App">
            <Header />
            <main className="main-content-container">{children}</main>
            <ChatbotWrapper /> {/* 챗봇 플로팅 버튼/팝업 */}
            <footer>
              {/* 🌟 한국어 우선 푸터 텍스트 */}
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-sub)",
                  padding: "20px 0",
                  borderTop: "1px solid var(--color-border)",
                  fontSize: "0.9em",
                }}
              >
                &copy; {new Date().getFullYear()} MinKowskiM. All rights
                reserved.
              </p>
            </footer>
          </div>
        </ProvidersWrapper>
      </body>
    </html>
  );
}

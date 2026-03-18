// app/layout.jsx (Server Component)
import { Montserrat, Nanum_Myeongjo, Caveat } from "next/font/google"; // Caveat 추가

import { ThemeProvider } from "../providers/ThemeProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { ToastProvider } from "../providers/ToastProvider";
import Header from "../components/common/Header";

import ChatbotWrapper from "../components/Chatbot/ChatbotWrapper";
import OAuthCallbackHandler from "../components/Auth/OAuthCallbackHandler";
import GlobalBackground from "../components/Hero/GlobalBackground";

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

// SEO-optimized metadata
export const metadata = {
  metadataBase: new URL("https://minkowskim.com"),
  title: {
    default: "MinKowskiM | Think structurally, live beyond time.",
    template: "%s | MinKowskiM",
  },
  description:
    "Personal dev blog: backend, frontend, AI/ML. In-depth posts on software development trends and tech stacks.",
  keywords: [
    "MinKowskiM",
    "development blog",
    "Next.js",
    "React",
    "Spring Boot",
    "tech",
    "software",
  ],
  alternates: {
    canonical: "https://minkowskim.com",
    languages: { ko: "https://minkowskim.com", en: "https://minkowskim.com", "x-default": "https://minkowskim.com" },
  },
  openGraph: {
    title: "MinKowskiM | Think structurally, live beyond time.",
    description: "Personal dev blog: backend, frontend, AI/ML. In-depth posts on software development and tech.",
    url: "https://minkowskim.com",
    siteName: "MinKowskiM",
    type: "website",
    locale: "en_US",
    alternateLocale: ["ko_KR"],
    images: [{ url: "/icon.svg", alt: "MinKowskiM" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MinKowskiM",
    description: "Personal dev blog: backend, frontend, AI/ML.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: {
    icon: [{ url: "https://minkowskim.com/icon.svg", type: "image/svg+xml" }, { url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "https://minkowskim.com/icon.svg", type: "image/svg+xml" }, { url: "/icon.svg", type: "image/svg+xml" }],
  },
  category: "technology",
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
      lang="en"
      className={`${montserrat.variable} ${nanumMyeongjo.variable} ${caveat.variable}`}
    >
      <body>
        <ProvidersWrapper>
          <GlobalBackground />
          <div className="App">
            <Header />
            <main className="main-content-container">{children}</main>
            <ChatbotWrapper /> {/* 챗봇 플로팅 버튼/팝업 */}
            <footer className="main-footer">
              <div className="main-footer__sns">
                <a href="https://github.com/minkyeom" target="_blank" rel="noopener noreferrer" className="main-footer__link main-footer__github" aria-label="GitHub (MinKyeom)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="https://mikysdailylife.com/" target="_blank" rel="noopener noreferrer" className="main-footer__link main-footer__blog main-footer__mk" aria-label="Miky's Daily Life (Blog)">
                  <span className="main-footer__mk-icon" aria-hidden="true">MK</span>
                </a>
              </div>
              <p className="main-footer__text">
                &copy; 2026 MinKowskiM. All rights reserved.{" "}
                <a href="/privacy" className="main-footer__link">Privacy policy</a>
              </p>
            </footer>
          </div>
        </ProvidersWrapper>
      </body>
    </html>
  );
}

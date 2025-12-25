// src/components/MarkdownRenderer.jsx
"use client"; 

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // GitHub Flavored Markdown (테이블, 체크박스 등)
import rehypeRaw from 'rehype-raw'; // 마크다운 내부에 HTML 사용 허용

// ===================================================================
// ⭐ 1. 구문 강조를 위한 라이브러리 임포트
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// ⭐ 2. 사용할 테마 임포트 (여기서는 'darcula' 테마 사용)
import { darcula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
// ===================================================================

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // 커스텀 컴포넌트 정의를 통해 디자인 유지 및 코드 블록 처리
          
          // 헤더 스타일을 위해 클래스 적용 (globals.css에 정의)
          h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
          h4: ({ node, ...props }) => <h4 className="markdown-h4" {...props} />,

          // 인용구 스타일을 위해 클래스 적용 (globals.css에 정의)
          blockquote: ({ node, ...props }) => <blockquote className="markdown-blockquote" {...props} />,
          
          // ⭐ 3. 코드 블록 (```) 및 인라인 코드 (`) 렌더링 재정의
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');

            // 3-1. 인라인 코드: `code`
            if (inline) {
              return <code className="markdown-inline-code" {...props}>{children}</code>;
            }
            
            // 3-2. 코드 블록: ```language (구문 강조 적용)
            return match ? (
              <SyntaxHighlighter
                {...props}
                style={darcula} // ⭐ 다크 모드에 최적화된 테마 적용
                language={match[1]} // 언어 설정
                PreTag="div" // HTML 태그를 div로 변경하여 스타일 충돌 방지
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              // 언어가 지정되지 않은 코드 블록이거나 Prism 지원 외의 경우
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      />
    </div>
  );
};

export default MarkdownRenderer;
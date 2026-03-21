// src/components/MarkdownRenderer.jsx
"use client"; 

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/cjs/styles/prism';

/** 목차 링크용 헤딩 id 생성 (TableOfContents와 동일 규칙) */
function slugify(text) {
  if (text == null) return '';
  return String(text).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\uac00-\ud7a3-]/g, '');
}

function headingText(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(headingText).join('');
  if (children?.props?.children != null) return headingText(children.props.children);
  return '';
}

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ node, children, ...props }) => (
            <h1 className="markdown-h1" id={slugify(headingText(children)) || undefined} {...props}>{children}</h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className="markdown-h2" id={slugify(headingText(children)) || undefined} {...props}>{children}</h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className="markdown-h3" id={slugify(headingText(children)) || undefined} {...props}>{children}</h3>
          ),
          h4: ({ node, children, ...props }) => (
            <h4 className="markdown-h4" id={slugify(headingText(children)) || undefined} {...props}>{children}</h4>
          ),

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
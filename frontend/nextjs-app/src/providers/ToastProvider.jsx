// src/providers/ToastProvider.jsx
"use client";

import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect, 
  forwardRef, 
} from "react";
import { createPortal } from "react-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "../styles/Toast.css"; 
// lucide-react 아이콘 임포트 
import { Check, X, AlertTriangle, Info } from "lucide-react";

// 1. Context 생성
export const ToastContext = createContext();

// 헬퍼 함수: 토스트 유형에 따른 아이콘 반환
const getIcon = (type) => {
  switch (type) {
    case "success":
      return <Check size={20} />;
    case "error":
      return <X size={20} />;
    case "warning":
      return <AlertTriangle size={20} />;
    case "info":
    default:
      return <Info size={20} />;
  }
};

// 헬퍼 컴포넌트: 단일 토스트 아이템
// ⭐ 수정 1: forwardRef로 컴포넌트를 감싸 ref를 받을 준비
const ToastItem = forwardRef(({ message, type, id, onDismiss }, ref) => {
  const bgColor = {
    success: "#4CAF50",
    error: "#F44336",
    warning: "#FF9800",
    info: "#2196F3",
  };

  useEffect(() => {
    // 4초 후 자동으로 닫히도록 설정
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 4000);

    return () => clearTimeout(timer); // 클린업 함수
  }, [id, onDismiss]);

  return (
    // ⭐ 수정 2: ref를 div에 연결
    <div 
        ref={ref} 
        className="toast-item" 
        style={{ backgroundColor: bgColor[type] }} 
        onClick={() => onDismiss(id)} // 클릭 시 닫기
    >
      {getIcon(type)}
      <span style={{ marginLeft: "10px" }}>{message}</span>
    </div>
  );
});

ToastItem.displayName = 'ToastItem'; // 린트 오류 방지를 위해 displayName 설정

let nextId = 0; // 토스트 고유 ID를 위한 카운터

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  // ⭐ 수정 3: 클라이언트 환경에서 마운트되었는지 확인하는 상태
  const [mounted, setMounted] = useState(false); 
  
  useEffect(() => {
    setMounted(true); // 컴포넌트가 클라이언트에서 마운트되면 true로 설정
  }, []);

  // 토스트를 띄우는 함수
  const showToast = useCallback(({ message, type = "info" }) => {
    const newToast = { id: nextId++, message, type };
    // 최신 토스트가 위에 표시되도록 prepend (배열 앞에 추가)
    setToasts((prev) => [newToast, ...prev]); 
  }, []);

  // 토스트를 닫는 함수
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* ⭐ 수정 5: mounted 상태일 때만 createPortal 렌더링 (하이드레이션 오류 해결) */}
      {mounted &&
        document.body &&
        createPortal(
          <div className="toast-container">
            <TransitionGroup>
              {toasts.map((toast) => {
                // ⭐ 수정 6: React.createRef()를 사용하여 Hooks 규칙 위반 방지
                const nodeRef = React.createRef();

                return (
                  // CSSTransition을 사용하여 class 기반 애니메이션 적용
                  <CSSTransition
                    key={toast.id}
                    timeout={300} // CSS의 transition 시간과 일치
                    classNames="toast-transition" // CSS 클래스명을 "toast-transition"으로 변경 (일반적인 패턴)
                    nodeRef={nodeRef} // ⭐ nodeRef 전달
                  >
                    <ToastItem
                      message={toast.message} 
                      type={toast.type}
                      id={toast.id}
                      onDismiss={dismissToast}
                      ref={nodeRef} // ⭐ ToastItem에 ref prop으로 전달
                    />
                  </CSSTransition>
                );
              })}
            </TransitionGroup>
          </div>,
          document.body // body에 포털로 렌더링
        )}
    </ToastContext.Provider>
  );
};
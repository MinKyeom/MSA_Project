// src/hooks/useToast.js
"use client";

import { useContext } from 'react';
import { ToastContext } from '../providers/ToastProvider';

/**
 * Toast 알림을 띄우는 커스텀 훅
 * showToast({ message, type: 'success' | 'error' | 'info' | 'warning' })
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
'use client';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

export default function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </MotionConfig>
  );
}

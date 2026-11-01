'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };
const TONES = {
  success: 'border-emerald-500/40 text-emerald-300',
  error: 'border-rose-500/40 text-rose-300',
  info: 'border-brand-500/40 text-brand-300',
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { id, message, type }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4200);
  }, []);

  const toast = useCallback(
    Object.assign((m, t) => push(m, t), {
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
      info: (m) => push(m, 'info'),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5" role="status" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                className={`pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border bg-ink-800/95 px-4 py-3 text-sm shadow-card backdrop-blur ${TONES[t.type]}`}
              >
                <Icon size={18} className="mt-0.5 shrink-0" />
                <span className="text-slate-100">{t.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

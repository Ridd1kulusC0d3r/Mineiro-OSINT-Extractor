import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Copy, Download, FileCode, Printer, X, Info, ShieldCheck } from 'lucide-react';

export type ToastType = 'success' | 'copy' | 'download' | 'export' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: { title: string; message?: string; type?: ToastType; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      title,
      message,
      type = 'success',
      duration = 3800,
    }: {
      title: string;
      message?: string;
      type?: ToastType;
      duration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, title, message, type, duration };

      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep up to 4 active toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const getIcon = (type?: ToastType) => {
    switch (type) {
      case 'copy':
        return <Copy className="w-4 h-4 text-white shrink-0" />;
      case 'download':
      case 'export':
        return <Download className="w-4 h-4 text-white shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-neutral-300 shrink-0" />;
      case 'success':
      default:
        return <Check className="w-4 h-4 text-white shrink-0" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        id="toast-notification-container"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              id={`toast-item-${toast.id}`}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="pointer-events-auto bg-neutral-950 border border-neutral-700 shadow-2xl p-3.5 font-mono relative overflow-hidden"
              style={{
                boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Subtle top indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-neutral-700">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: (toast.duration || 3800) / 1000, ease: 'linear' }}
                  className="h-full bg-white"
                />
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-neutral-900 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(toast.type)}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-xs uppercase tracking-wider truncate">
                      {toast.title}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 bg-neutral-800 text-neutral-300 font-mono">
                      CONFIRMED
                    </span>
                  </div>
                  {toast.message && (
                    <p className="text-[11px] text-neutral-400 font-sans mt-0.5 leading-tight">
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-neutral-500 hover:text-white p-1 transition-colors shrink-0 -mr-1 -mt-1"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

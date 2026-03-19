"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { X } from "lucide-react";

// ─── Types ───────────────────────────────────────

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

// ─── Context ─────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ─── Provider ────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newToast: Toast = { id, ...t };
      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5

      const duration = t.duration ?? 4000;
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Toast Container ─────────────────────────────

const variantStyles: Record<string, string> = {
  default: "border-white/[0.08]",
  success: "border-emerald-500/20",
  error: "border-red-500/20",
  warning: "border-amber-500/20",
};

const variantDot: Record<string, string> = {
  default: "bg-indigo-400",
  success: "bg-emerald-400",
  error: "bg-red-400",
  warning: "bg-amber-400",
};

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`glass rounded-xl px-4 py-3 shadow-2xl shadow-black/40 animate-slide-in-right ${variantStyles[t.variant || "default"]}`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${variantDot[t.variant || "default"]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90">{t.title}</p>
              {t.description && (
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="p-0.5 rounded text-white/20 hover:text-white/50 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

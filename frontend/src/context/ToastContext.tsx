import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

export type ToastInput = {
  variant?: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number;
};

type Toast = ToastInput & { id: string; createdAt: number; variant: ToastVariant; durationMs: number };

type ToastContextType = {
  push: (t: ToastInput) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function classForVariant(variant: ToastVariant): string {
  if (variant === "success") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (variant === "error") return "border-red-500/20 bg-red-500/10 text-red-200";
  return "border-slate-700 bg-slate-900/90 text-slate-200";
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((xs) => xs.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const toast: Toast = {
        id,
        createdAt: Date.now(),
        variant: input.variant || "info",
        title: input.title,
        description: input.description,
        durationMs: input.durationMs ?? 3500,
      };

      setToasts((xs) => [toast, ...xs].slice(0, 5));

      window.setTimeout(() => {
        remove(id);
      }, toast.durationMs);
    },
    [remove]
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed top-4 right-4 z-[100] w-[92vw] sm:w-[420px] space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl border shadow-2xl backdrop-blur-xl p-4 animate-in fade-in slide-in-from-top-2 ${classForVariant(
              t.variant
            )}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{t.title}</div>
                {t.description && <div className="text-xs mt-1 text-white/70 break-words">{t.description}</div>}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 rounded-lg p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

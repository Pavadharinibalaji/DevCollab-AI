"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useMemo(() => ({
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string) => addToast(msg, "error"),
    info: (msg: string) => addToast(msg, "info"),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 pointer-events-auto",
              t.type === "success" && "bg-emerald-950/90 text-emerald-200 border-emerald-500/30",
              t.type === "error" && "bg-destructive/90 text-destructive-foreground border-destructive/30",
              t.type === "info" && "bg-muted/90 text-muted-foreground border-border"
            )}
            role="alert"
          >
            {t.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />}
            {t.type === "error" && <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />}
            {t.type === "info" && <Info className="h-5 w-5 text-sky-400 shrink-0" />}
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 p-1 rounded-full transition-colors"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}

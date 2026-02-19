"use client";
import { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: number; message: string; type: ToastType; }
const ToastContext = createContext<{ toast: (message: string, type?: ToastType) => void }>({ toast: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const colors: Record<ToastType, string> = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-amber-600 text-white",
    info: "bg-blue-600 text-white",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium animate-slide-in ${colors[t.type]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

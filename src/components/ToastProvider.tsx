import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Toast from "./Toast";
import { ToastContext, type ToastType } from "./toast-context";
type ToastState = { type: ToastType; message: string } | null;

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback(
    (type: ToastType, message: string, durationMs = 5000) => {
      setToast({ type, message });
      window.setTimeout(() => setToast(null), durationMs);
    },
    []
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
      {children}
    </ToastContext.Provider>
  );
}

import { createContext, useContext } from "react";

export type ToastType = "success" | "error";

export type ToastContextValue = {
  showToast: (type: ToastType, message: string, durationMs?: number) => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(
  undefined
);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

import { memo } from "react";
import styles from "./Toast.module.css";
import { SuccessSVG, ErrorSVG } from "../assets/svgs";

export type ToastType = "success" | "error";

type ToastProps = {
  type: ToastType;
  message: string;
  className?: string;
};

function Toast(props: ToastProps) {
  const { type, message, className } = props;
  return (
    <div
      className={`${styles.toast} ${
        type === "success" ? styles.toastSuccess : styles.toastError
      } ${className || ""}`}
    >
      <div className={styles.toastIcon}>
        {type === "success" ? <SuccessSVG /> : <ErrorSVG />}
      </div>
      <span className={styles.toastMessage}>{message}</span>
    </div>
  );
}

export default memo(Toast);

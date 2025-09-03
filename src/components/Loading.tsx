import { memo } from "react";
import { SpinnerSVG } from "../assets/svgs";
import styles from "./Loading.module.css";

export interface LoadingProps {
  message?: string;

  size?: "small" | "medium" | "large";

  variant?: "spinner" | "overlay" | "inline" | "button";

  show?: boolean;

  className?: string;

  centered?: boolean;

  color?: string;
}

function Loading({
  message = "در حال بارگذاری...",
  size = "medium",
  variant = "spinner",
  show = true,
  className = "",
  centered = true,
  color,
}: LoadingProps) {
  if (!show) return null;

  const containerClasses = [
    styles.loadingContainer,
    styles[variant],
    styles[size],
    centered ? styles.centered : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const spinnerClasses = [styles.spinner, styles[`spinner-${size}`]]
    .filter(Boolean)
    .join(" ");

  const spinnerStyle = color ? { color } : undefined;

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses} style={spinnerStyle}>
        <SpinnerSVG />
      </div>
      {message && <span className={styles.message}>{message}</span>}
    </div>
  );
}

export default memo(Loading);



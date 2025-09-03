import { useState, useEffect } from "react";
import styles from "./PWAInstallPrompt.module.css";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkIfInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        return;
      }

      if (
        (window.navigator as Navigator & { standalone?: boolean })
          .standalone === true
      ) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  const dismissedTime = localStorage.getItem("pwa-install-dismissed");
  if (
    dismissedTime &&
    Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000
  ) {
    return null;
  }

  return (
    <div className={styles.installPrompt}>
      <div className={styles.installContent}>
        <div className={styles.installIcon}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
              fill="currentColor"
            />
            <path
              d="M19 15L19.5 17L21 17.5L19.5 18L19 20L18.5 18L17 17.5L18.5 17L19 15Z"
              fill="currentColor"
            />
            <path
              d="M5 15L5.5 17L7 17.5L5.5 18L5 20L4.5 18L3 17.5L4.5 17L5 15Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className={styles.installText}>
          <h3>نصب اپلیکیشن</h3>
          <p>برای دسترسی سریع‌تر، اپلیکیشن را روی دستگاه خود نصب کنید</p>
        </div>
        <div className={styles.installActions}>
          <button className={styles.installButton} onClick={handleInstallClick}>
            نصب
          </button>
          <button className={styles.dismissButton} onClick={handleDismiss}>
            بعداً
          </button>
        </div>
      </div>
    </div>
  );
}

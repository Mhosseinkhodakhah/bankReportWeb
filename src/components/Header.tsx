import { memo, useState } from "react";
import styles from "./Header.module.css";
import { logo } from "../assets/images";
import { UserSVG, LogoutSVG } from "../assets/svgs";
import { logout } from "../api/authService";
type HeaderCurrent = "dashboard" | "history" | "admin";

interface HeaderProps {
  current: HeaderCurrent;
  displayName?: string;
}

function Header({ current, displayName = "کاربر" }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const goToDashboard = () => {
    setIsMobileMenuOpen(false);
    window.location.href = "/";
  };

  const goToHistory = () => {
    setIsMobileMenuOpen(false);
    window.location.href = "/history";
  };

  const goToAdmin = () => {
    setIsMobileMenuOpen(false);
    window.location.href = "/admin";
  };

  const handleLogout = async () => {
    try {
      await logout();

      localStorage.clear();

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);

      localStorage.clear();
      window.location.href = "/login";
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  console.log(localStorage.getItem("user_role"));

  return (
    <header className={styles.header}>
      <div className={styles.navigation}>
        <div className={styles.logo}>
          <img src={logo} alt="logo" width={78} height={78} />
        </div>
        <button
          onClick={goToDashboard}
          className={`${styles.navButton} ${
            current === "dashboard" ? styles.active : ""
          }`}
        >
          آپلود فایل
        </button>
        <button
          onClick={goToHistory}
          className={`${styles.navButton} ${
            current === "history" ? styles.active : ""
          }`}
        >
          تاریخچه پردازش ها
        </button>
        {localStorage.getItem("user_role") === "superAdmin" ? (
          <button
            onClick={goToAdmin}
            className={`${styles.navButton} ${
              current === "admin" ? styles.active : ""
            }`}
          >
            مدیریت ادمین ها
          </button>
        ) : null}
      </div>

      <div className={styles.userInfo}>
        <span className={styles.userName}>{displayName}</span>

        <button
          onClick={handleLogout}
          className={styles.actionButton}
          title="خروج"
        >
          <LogoutSVG />
        </button>

        <UserSVG />
      </div>

      <button
        onClick={toggleMobileMenu}
        className={`${styles.mobileMenuButton} ${
          isMobileMenuOpen ? styles.active : ""
        }`}
        aria-label="منوی موبایل"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div
        className={`${styles.mobileMenu} ${
          isMobileMenuOpen ? styles.open : ""
        }`}
      >
        <button
          onClick={goToDashboard}
          className={`${styles.mobileNavButton} ${
            current === "dashboard" ? styles.active : ""
          }`}
        >
          آپلود فایل
        </button>
        <button
          onClick={goToHistory}
          className={`${styles.mobileNavButton} ${
            current === "history" ? styles.active : ""
          }`}
        >
          تاریخچه پردازش ها
        </button>
        {localStorage.getItem("user_role") === "superAdmin" ? (
          <button
            onClick={goToAdmin}
            className={`${styles.mobileNavButton} ${
              current === "admin" ? styles.active : ""
            }`}
          >
            مدیریت ادمین ها
          </button>
        ) : null}

        <div
          className={`${styles.mobileUserInfo} ${
            isMobileMenuOpen ? styles.open : ""
          }`}
        >
          <span className={styles.mobileUserName}>{displayName}</span>
          <button onClick={handleLogout} className={styles.mobileLogoutButton}>
            <LogoutSVG />
            خروج
          </button>
        </div>
      </div>
    </header>
  );
}

export default memo(Header);

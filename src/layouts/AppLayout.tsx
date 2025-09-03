import { memo, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";

function AppLayout() {
  const location = useLocation();

  const { current, displayName } = useMemo(() => {
    const path = location.pathname;
    let current: "dashboard" | "history" | "admin" = "dashboard";
    let title = "خاطنا";
    if (path.startsWith("/history")) {
      current = "history";
    } else if (path.startsWith("/admin")) {
      current = "admin";
      title = "مدیریت ادمین ها";
    }

    const firstName = localStorage.getItem("firstName") || "";
    const lastName = localStorage.getItem("lastName") || "";
    const phoneNumber = localStorage.getItem("phoneNumber") || "";
    const displayName =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : phoneNumber || "کاربر";

    return { current, title, displayName };
  }, [location.pathname]);

  return (
    <div>
      <Header current={current} displayName={displayName} />
      <Outlet />
      <footer className="app-footer">
        <span>تمامی حقوق مادی و معنوی متعلق به خانه طلا میباشد.</span>
      </footer>
    </div>
  );
}

export default memo(AppLayout);

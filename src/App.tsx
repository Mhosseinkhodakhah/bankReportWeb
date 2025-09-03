import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import AdminPage from "./pages/Admin";
import HistoryPage from "./pages/History";
import AppLayout from "./layouts/AppLayout";
import ToastProvider from "./components/ToastProvider";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

function ProtectedRoute() {
  const isAuthed =
    typeof localStorage !== "undefined" && !!localStorage.getItem("auth_token");
  return isAuthed ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const userRole = localStorage.getItem("user_role");

  const isAdmin = userRole === "superAdmin";
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PWAInstallPrompt />
      </ToastProvider>
    </BrowserRouter>
  );
}

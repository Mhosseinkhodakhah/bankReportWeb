import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authService";
import styles from "./Login.module.css";
import { logo } from "../assets/images";
import Loading from "../components/Loading";
import { useLoading } from "../hooks/useLoading";

function LoginPage() {
  const navigate = useNavigate();
  const { loading, execute } = useLoading();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      await execute(async () => {
        if (!phoneNumber || !password)
          throw new Error("لطفاً شماره تلفن و رمز عبور را وارد کنید");

        const response = await login({ phoneNumber, password });

        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("firstName", response.data.firstName);
        localStorage.setItem("lastName", response.data.lastName);
        localStorage.setItem("phoneNumber", response.data.phoneNumber);
        localStorage.setItem("user_role", response.data.role);

        navigate("/", { replace: true });
      }).catch((err: unknown) => {
        const errorMessage =
          err instanceof Error ? err.message : "ورود ناموفق بود";
        setError(errorMessage);
      });
    },
    [navigate, phoneNumber, password, execute]
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img className={styles.logo} src={logo} alt="logo" />
        <h1 className={styles.heading}>اپلیکیشن مدیریت محاسبات خانه طلا</h1>
      </div>
      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.field}>
          <input
            id="phoneNumber"
            placeholder=" "
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            autoComplete="tel"
            className={styles.input}
          />
          <label htmlFor="phoneNumber" className={styles.label}>
            شماره تلفن
          </label>
        </div>
        <div className={styles.field}>
          <input
            id="password"
            placeholder=" "
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={styles.input}
          />
          <label htmlFor="password" className={styles.label}>
            رمز عبور
          </label>
          <button
            type="button"
            aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
            className={styles.eye}
            onClick={useCallback(() => setShowPassword((v) => !v), [])}
            disabled={loading}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.74-1.64 1.84-3.16 3.16-4.47M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-1.03 2.28-2.76 4.22-4.85 5.63M1 1l22 22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button disabled={loading} className={styles.button}>
          {loading ? (
            <Loading variant="button" message="در حال ورود..." size="small" />
          ) : (
            "ورود"
          )}
        </button>
      </form>
    </div>
  );
}

export default memo(LoginPage);

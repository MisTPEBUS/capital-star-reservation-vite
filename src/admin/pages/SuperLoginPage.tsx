import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { verifySuperAdminToken } from "../../api/admin/auth";
import {
  hasValidAdminSession,
  saveSuperAdminSession,
} from "../../api/admin/session";

export function SuperLoginPage() {
  const navigate = useNavigate();
  const [superAdminToken, setSuperAdminToken] = useState("");
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hasValidAdminSession()) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = superAdminToken.trim();

    if (!token) {
      setErrorMessage("請輸入 Super Admin Token。");
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    try {
      await verifySuperAdminToken(token);
      saveSuperAdminSession(token);
      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Super Admin 驗證失敗。",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="admin-shell flex items-center justify-center p-4">
      <section className="w-full max-w-md">
        <header className="mb-8 text-center">
          <p className="mt-6 text-xs font-bold tracking-[0.3em] text-amber-300">
            SUPER ADMIN
          </p>
          <h1 className="mt-3 text-3xl font-bold text-admin-text">
            首都之星管理後台
          </h1>
          <p className="mt-3 text-sm text-admin-muted">
            系統維運專用登入
          </p>
        </header>

        <form className="admin-panel p-5 sm:p-6" noValidate onSubmit={handleSubmit}>
          <label
            className="block text-sm font-medium text-admin-softText"
            htmlFor="super-admin-token"
          >
            Super Admin Token
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="super-admin-token"
              aria-describedby={errorMessage ? "super-login-error" : undefined}
              aria-invalid={Boolean(errorMessage)}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="h-14 min-w-0 flex-1 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-4 font-mono text-sm text-admin-text outline-none transition placeholder:text-admin-muted focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/15"
              placeholder="請貼上 Token"
              spellCheck={false}
              type={isTokenVisible ? "text" : "password"}
              value={superAdminToken}
              onChange={(event) => setSuperAdminToken(event.target.value)}
            />
            <button
              aria-controls="super-admin-token"
              aria-pressed={isTokenVisible}
              className="h-14 shrink-0 rounded-adminControl border border-admin-borderStrong px-3 text-sm font-semibold text-admin-softText transition hover:bg-admin-elevated hover:text-admin-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adminStatus-enabled"
              type="button"
              onClick={() => setIsTokenVisible((isVisible) => !isVisible)}
            >
              {isTokenVisible ? "隱藏" : "顯示"}
            </button>
          </div>

          {errorMessage && (
            <p
              id="super-login-error"
              className="mt-3 text-sm text-red-300"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <button
            className="mt-6 h-14 w-full rounded-adminControl bg-adminStatus-enabled px-4 font-bold text-admin-bg transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adminStatus-enabled disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isVerifying}
          >
            {isVerifying ? "驗證中..." : "登入"}
          </button>
          <Link
            className="mt-4 block w-full py-2 text-center text-sm font-medium text-adminStatus-enabled"
            to="/admin/login"
          >
            返回一般登入
          </Link>
        </form>

        <p className="mt-7 text-center text-xs leading-5 text-admin-muted">
          Token 僅保存於目前分頁，關閉分頁或 8 小時後需重新登入
          <br />
          僅限授權維運人員使用
        </p>
      </section>
    </main>
  );
}

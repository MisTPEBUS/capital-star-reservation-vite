import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import {
  type AdminUser,
  type UserRole,
  findUserByActiveCode,
  updateUserRole,
} from "../../api/admin/users";

const roleOptions: Array<{
  value: UserRole;
  label: string;
  description: string;
}> = [
  { value: "MEMBER", label: "會員", description: "" },
  { value: "STAFF", label: "工作人員", description: "" },
  {
    value: "ADMIN",
    label: "管理人員",
    description: "",
  },
];

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
}

export function UserPermissionsPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => setSuccess(null), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = query.trim();

    if (!/^\d{8}$/.test(keyword)) {
      setUsers([]);
      setError("請輸入 8 碼活動驗證碼。");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await findUserByActiveCode(keyword);
      setUsers([user]);
    } catch (requestError) {
      setUsers([]);
      setError(getErrorMessage(requestError, "查詢會員資訊失敗，請稍後再試。"));
    } finally {
      setIsSearching(false);
    }
  };

  const handleRoleChange = async (user: AdminUser, role: UserRole) => {
    if (user.role === role) return;

    if (!user.activeCode) {
      setError("此使用者缺少活動驗證碼，無法更新權限。");
      return;
    }

    setUpdatingUserId(user.userId);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await updateUserRole(user.activeCode, role);
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.userId === user.userId
            ? {
                ...currentUser,
                role: updatedUser.role,
                updatedAt: updatedUser.updatedAt,
              }
            : currentUser,
        ),
      );
      const roleLabel = roleOptions.find(
        (option) => option.value === role,
      )?.label;
      setSuccess(`使用者權限已更新為${roleLabel}。`);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "更新權限失敗，請稍後再試。"));
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <p className="admin-page-kicker">USER PERMISSIONS</p>
        <h1 className="admin-page-title">權限設定</h1>
        <p className="admin-page-description">
          查詢會員資料後，可將身分設定為會員、工作人員或管理人員。
        </p>
      </section>

      <section className="admin-panel-body">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={handleSearch}
        >
          <label className="sr-only" htmlFor="user-query">
            查詢會員
          </label>
          <input
            id="user-query"
            className="h-11 min-w-0 flex-1 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-4 text-admin-text outline-none placeholder:text-admin-muted focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/15"
            inputMode="numeric"
            maxLength={8}
            placeholder="請輸入 8 碼活動驗證碼"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value.replace(/\D/g, ""))
            }
          />
          <button
            className="h-11 rounded-adminControl bg-adminStatus-enabled px-5 text-sm font-bold text-admin-bg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSearching}
            type="submit"
          >
            {isSearching ? "查詢中…" : "查詢會員"}
          </button>
        </form>

        {error && (
          <p
            className="mt-4 rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            className="mt-4 rounded-adminControl border border-adminStatus-enabled/30 bg-adminStatus-enabled/10 px-4 py-3 text-sm text-adminStatus-enabledText"
            role="status"
          >
            {success}
          </p>
        )}
      </section>

      {users.length > 0 && (
        <section className="admin-panel-body overflow-hidden p-0">
          {/*  <div className="border-b border-admin-border px-5 py-4">
            <h2 className="admin-section-title">查詢結果</h2>
            <p className="mt-1 text-sm text-admin-muted">
              共 {users.length} 位會員
            </p>
          </div> */}
          <div className="divide-y divide-admin-border">
            {users.map((user) => {
              const isUpdating = updatingUserId === user.userId;

              return (
                <article
                  className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_260px] md:items-center"
                  key={user.userId}
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-admin-text">
                      {user.displayName || "未設定名稱"}
                    </h3>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-admin-muted sm:grid-cols-2">
                      {user.lineId && (
                        <div>
                          <dt className="inline">LINE ID： </dt>
                          <dd className="inline break-all text-admin-softText">
                            {user.lineId}
                          </dd>
                        </div>
                      )}
                      {user.activeCode && (
                        <div>
                          <dt className="inline">活動碼： </dt>
                          <dd className="inline font-mono text-admin-softText">
                            {user.activeCode}
                          </dd>
                        </div>
                      )}
                      {user.phone && (
                        <div>
                          <dt className="inline">電話： </dt>
                          <dd className="inline text-admin-softText">
                            {user.phone}
                          </dd>
                        </div>
                      )}
                      {user.email && (
                        <div>
                          <dt className="inline">Email： </dt>
                          <dd className="inline break-all text-admin-softText">
                            {user.email}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium text-admin-softText"
                      htmlFor={`role-${user.userId}`}
                    >
                      身分權限
                    </label>
                    <select
                      className="mt-2 h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-sm font-semibold text-admin-text outline-none focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/15 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isUpdating}
                      id={`role-${user.userId}`}
                      value={user.role}
                      onChange={(event) =>
                        handleRoleChange(user, event.target.value as UserRole)
                      }
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}（{option.value}）
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-admin-muted">
                      {isUpdating
                        ? "更新中…"
                        : roleOptions.find(
                            (option) => option.value === user.role,
                          )?.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

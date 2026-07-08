import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  type AdminUser,
  type UserRole,
  getAdminUsers,
  updateUserRole,
} from "../../api/admin/users";

type RoleFilter = "ALL" | UserRole;

const roleOptions: Array<{
  value: UserRole;
  label: string;
}> = [
  { value: "MEMBER", label: "會員" },
  { value: "STAFF", label: "工作人員" },
  { value: "ADMIN", label: "管理人員" },
];

const roleFilters: Array<{ value: RoleFilter; label: string }> = [
  { value: "ALL", label: "全部" },
  ...roleOptions,
];

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
}

function getRoleLabel(role: UserRole) {
  return roleOptions.find((option) => option.value === role)?.label ?? role;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value || "-";

  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

export function UserPermissionsPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedRole = roleFilter === "ALL" ? undefined : roleFilter;

  const loadUsers = async (role = selectedRole) => {
    setIsLoading(true);
    setError(null);

    try {
      const nextUsers = await getAdminUsers(role);
      setUsers(nextUsers);
    } catch (requestError) {
      setUsers([]);
      setError(getErrorMessage(requestError, "使用者清單讀取失敗。"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers(selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => setSuccess(null), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) return users;

    return users.filter((user) => {
      const searchableText = [
        user.displayName,
        user.lineId,
        user.userId,
        user.activeCode,
        user.phone,
        user.email,
        user.role,
        user.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedKeyword);
    });
  }, [keyword, users]);

  const userCountLabel = useMemo(() => {
    if (isLoading) return "讀取中";
    return keyword.trim()
      ? `${filteredUsers.length} / ${users.length} 位使用者`
      : `${users.length} 位使用者`;
  }, [filteredUsers.length, isLoading, keyword, users.length]);

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
      setSuccess(`使用者權限已更新為${getRoleLabel(role)}。`);

      if (selectedRole && selectedRole !== role) {
        await loadUsers(selectedRole);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "更新權限失敗，請稍後再試。"));
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="admin-page-title">權限設定</h1>
          <p className="admin-page-description">
            依照身分篩選使用者，並可直接在表格中調整權限。
          </p>
        </div>
        <button
          className="h-10 rounded-adminControl border border-admin-borderStrong px-4 text-sm font-semibold text-admin-softText disabled:opacity-50"
          disabled={isLoading}
          type="button"
          onClick={() => void loadUsers(selectedRole)}
        >
          重新整理
        </button>
      </section>

      <section className="admin-panel-body">
        <div className="grid gap-3 lg:grid-cols-[1fr_minmax(260px,360px)_auto] lg:items-center">
          <div
            aria-label="使用者角色篩選"
            className="flex flex-wrap gap-2"
            role="group"
          >
            {roleFilters.map((option) => {
              const isActive = roleFilter === option.value;

              return (
                <button
                  key={option.value}
                  className={`h-10 rounded-adminControl border px-4 text-sm font-semibold ${
                    isActive
                      ? "border-adminStatus-enabled bg-adminStatus-enabled text-admin-bg"
                      : "border-admin-borderStrong text-admin-softText hover:bg-admin-elevated hover:text-admin-text"
                  }`}
                  type="button"
                  onClick={() => setRoleFilter(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="flex min-w-0 gap-2">
            <label className="sr-only" htmlFor="user-keyword">
              關鍵字篩選
            </label>
            <input
              id="user-keyword"
              className="h-10 min-w-0 flex-1 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-sm text-admin-text outline-none placeholder:text-admin-muted focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/15"
              placeholder="搜尋姓名、LINE ID、識別碼、電話、Email"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            {keyword && (
              <button
                className="h-10 rounded-adminControl border border-admin-borderStrong px-3 text-sm font-semibold text-admin-softText hover:bg-admin-elevated hover:text-admin-text"
                type="button"
                onClick={() => setKeyword("")}
              >
                清除
              </button>
            )}
          </div>
          <span className="text-sm font-semibold text-admin-muted">
            {userCountLabel}
          </span>
        </div>

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

      <section className="admin-panel-body overflow-hidden p-0">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-admin-muted">
            讀取使用者清單中…
          </p>
        ) : users.length === 0 ? (
          <p className="px-4 py-8 text-center text-admin-muted">
            目前沒有符合條件的使用者。
          </p>
        ) : filteredUsers.length === 0 ? (
          <p className="px-4 py-8 text-center text-admin-muted">
            目前沒有符合關鍵字的使用者。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-admin-border bg-admin-bg text-xs text-admin-muted">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">使用者</th>
                  <th className="px-3 py-2.5 font-semibold">識別碼</th>
                  <th className="px-3 py-2.5 font-semibold">聯絡資訊</th>
                  <th className="px-3 py-2.5 font-semibold">狀態</th>
                  <th className="px-3 py-2.5 font-semibold">建立時間</th>
                  <th className="px-3 py-2.5 font-semibold">更新時間</th>
                  <th className="px-3 py-2.5 font-semibold">權限</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredUsers.map((user) => {
                  const isUpdating = updatingUserId === user.userId;

                  return (
                    <tr key={user.userId} className="text-admin-softText">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-admin-text">
                          {user.displayName || "未設定名稱"}
                        </p>
                        <p className="mt-1 break-all text-xs text-admin-muted">
                          {user.lineId || user.userId}
                        </p>
                      </td>
                      <td className="px-3 py-3 font-mono">
                        {user.activeCode || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <p>{user.phone || "-"}</p>
                        <p className="mt-1 break-all text-xs text-admin-muted">
                          {user.email || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`font-semibold ${
                            user.status === "ACTIVE" && user.isEnabled
                              ? "text-adminStatus-enabled"
                              : "text-admin-muted"
                          }`}
                        >
                          {user.status === "ACTIVE" && user.isEnabled
                            ? "啟用"
                            : "停用"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        {formatDateTime(user.updatedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className="h-10 w-full min-w-36 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-sm font-semibold text-admin-text outline-none focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/15 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isUpdating}
                          value={user.role}
                          onChange={(event) =>
                            handleRoleChange(
                              user,
                              event.target.value as UserRole,
                            )
                          }
                        >
                          {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}（{option.value}）
                            </option>
                          ))}
                        </select>
                        {isUpdating && (
                          <p className="mt-1 text-xs text-admin-muted">
                            更新中…
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

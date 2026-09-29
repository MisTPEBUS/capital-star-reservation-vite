import type { BookingRestrictionUser } from "../../api/admin/bookingRestrictions";
import { UserCheck } from "lucide-react";
import { Button } from "../../components/ui/button";

interface Props {
  users: BookingRestrictionUser[];
  loading: boolean;
  page: number;
  totalCount: number;
  totalPages: number;
  canRelease: boolean;
  onPageChange: (page: number) => void;
  onSelect: (userId: string) => void;
  onRelease: (user: BookingRestrictionUser) => void;
}

export function formatTaipeiDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

export function formatTaipeiRocDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    calendar: "roc",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}年${part("month")}月${part("day")}日`;
}

export const restrictionStatusLabel = {
  NORMAL: "正常",
  WARNING: "警示",
  BLOCKED: "限制中",
} as const;

export function BookingRestrictionTable({
  users,
  loading,
  page,
  totalCount,
  totalPages,
  canRelease,
  onPageChange,
  onSelect,
  onRelease,
}: Props) {
  return (
    <section className="admin-panel-body overflow-hidden p-0">
      {loading ? (
        <p className="px-4 py-10 text-center text-admin-muted">讀取中…</p>
      ) : users.length === 0 ? (
        <p className="px-4 py-10 text-center text-admin-muted">
          沒有符合條件的會員
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-base text-admin-softText">
            <thead className="bg-admin-bg text-admin-muted">
              <tr>
                <th className="px-4 py-3">會員</th>
                <th className="px-4 py-3">未搭乘次數</th>
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3">最近未搭乘</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {users.map((user) => (
                <tr key={user.userId}>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="rounded text-left font-bold text-admin-text underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-adminStatus-enabled"
                      onClick={() => onSelect(user.userId)}
                    >
                      {user.displayName}
                      <span className="block font-mono text-sm font-normal text-admin-muted">
                        {user.activeCode} · {user.phone ?? "未提供電話"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">{user.noShowCount} 次</td>
                  <td className="px-4 py-3">
                    {restrictionStatusLabel[user.status]}
                  </td>
                  <td className="px-4 py-3">
                    {formatTaipeiRocDate(user.lastNoShowAt)}
                  </td>
                  <td className="px-4 py-3">
                    {user.status === "BLOCKED" ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 border-red-400 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                        disabled={!canRelease || !user.currentRestrictionId}
                        onClick={() => onRelease(user)}
                        aria-label={`解除 ${user.displayName}（${user.activeCode}）的黑名單`}
                      >
                        <UserCheck aria-hidden="true" className="h-4 w-4" />
                        解除黑名單
                      </Button>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-border px-4 py-4 sm:px-5">
        <p className="text-base text-admin-muted">
          第 {page} / {totalPages} 頁
        </p>
        <nav aria-label="預約限制分頁" className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            上一頁
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            下一頁
          </Button>
        </nav>
      </div>
    </section>
  );
}

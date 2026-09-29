import { Fragment, useState } from "react";
import { ChevronDown, ShieldX, Unlock } from "lucide-react";
import type { BlacklistEntry } from "../../api/admin/blacklist";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

interface BlacklistTableProps {
  entries: BlacklistEntry[];
  isLoading: boolean;
  page: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRelease: (entry: BlacklistEntry) => void;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

function StatusBadge({ entry }: { entry: BlacklistEntry }) {
  const isActive = entry.status === "ACTIVE";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-base font-bold ring-1 ${
        isActive
          ? "bg-red-400/10 text-red-200 ring-red-400/30"
          : "bg-adminStatus-enabled/10 text-adminStatus-enabled ring-adminStatus-enabled/30"
      }`}
    >
      {isActive ? "限制中" : "已解除"}
    </span>
  );
}

function UnredeemedScheduleList({ entry }: { entry: BlacklistEntry }) {
  return (
    <div>
      <p className="mb-3 text-lg font-bold text-admin-text">未核銷預約班次</p>
      <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {entry.unredeemedReservations.map((reservation) => (
          <li
            key={reservation.reservationId}
            className="rounded-adminControl border border-admin-borderStrong bg-admin-surface px-4 py-3"
          >
            <p className="text-lg font-bold text-admin-text">
              {reservation.openDate}　{reservation.departureTime}
            </p>
            <p className="mt-1 text-base text-admin-muted">
              路線 {reservation.routeNumber} · 未核銷
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BlacklistTable({
  entries,
  isLoading,
  page,
  totalCount,
  totalPages,
  onPageChange,
  onRelease,
}: BlacklistTableProps) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const firstPage = Math.max(1, Math.min(page - 1, totalPages - 2));
  const visiblePageNumbers = Array.from(
    { length: Math.min(totalPages, 3) },
    (_, index) => firstPage + index,
  );
  const toggleEntry = (entry: BlacklistEntry) => {
    setExpandedEntryId((current) =>
      current === entry.blacklistId ? null : entry.blacklistId,
    );
  };

  return (
    <section className="admin-panel-body overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-admin-border px-4 py-3 sm:px-5">
        <h3 className="text-lg font-bold text-admin-text">列入黑名單的使用者</h3>
        <p className="text-base text-admin-muted">共 {totalCount} 位</p>
      </div>

      {isLoading ? (
        <p className="px-4 py-12 text-center text-lg text-admin-muted">讀取中…</p>
      ) : entries.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <ShieldX aria-hidden="true" className="mx-auto h-10 w-10 text-admin-muted" />
          <p className="mt-3 text-lg font-bold text-admin-text">
            沒有符合條件的使用者
          </p>
          <p className="mt-1 text-base text-admin-muted">請調整搜尋條件後再次查詢。</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 p-3 md:hidden">
            {entries.map((entry) => {
              const isExpanded = expandedEntryId === entry.blacklistId;
              const isActive = entry.status === "ACTIVE";

              return (
                <article
                  key={entry.blacklistId}
                  className="overflow-hidden rounded-adminPanel border border-admin-borderStrong bg-admin-surface"
                >
                  <button
                    aria-expanded={isExpanded}
                    aria-controls={`blacklist-mobile-detail-${entry.blacklistId}`}
                    className="flex w-full items-center gap-3 p-4 text-left outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-adminStatus-enabled/20"
                    type="button"
                    onClick={() => toggleEntry(entry)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-xl font-bold text-admin-text">
                        {entry.displayName}
                      </span>
                      <span className="mt-1 block font-mono text-base text-admin-muted">
                        {entry.activeCode} · {entry.phone ?? "未提供電話"}
                      </span>
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-6 w-6 shrink-0 text-admin-muted transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div className="grid grid-cols-2 gap-3 border-t border-admin-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-admin-muted">未核銷次數</p>
                      <p className="mt-1 text-lg font-bold text-red-200">
                        {entry.unredeemedCount} 次
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-admin-muted">目前狀態</p>
                      <div className="mt-1">
                        <StatusBadge entry={entry} />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-admin-muted">列入時間</p>
                      <p className="mt-1 text-base text-admin-softText">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      className="border-t border-admin-border bg-admin-bg/60 p-4"
                      id={`blacklist-mobile-detail-${entry.blacklistId}`}
                    >
                      <UnredeemedScheduleList entry={entry} />
                    </div>
                  )}

                  <div className="border-t border-admin-border p-3">
                    <Button
                      className="h-12 w-full border-red-400 bg-red-400 text-base font-bold text-slate-100 hover:bg-red-500 hover:text-slate-100"
                      disabled={!isActive}
                      type="button"
                      variant="destructive"
                      onClick={() => onRelease(entry)}
                    >
                      <Unlock aria-hidden="true" />
                      {isActive ? "解除黑名單" : "已解除"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[980px] text-lg">
              <TableHeader className="bg-admin-bg text-base font-bold text-admin-muted">
                <TableRow>
                  <TableHead>使用者</TableHead>
                  <TableHead>未核銷次數</TableHead>
                  <TableHead>列入時間</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-admin-border [&_td]:py-4">
                {entries.map((entry) => {
                  const isExpanded = expandedEntryId === entry.blacklistId;
                  const isActive = entry.status === "ACTIVE";

                  return (
                    <Fragment key={entry.blacklistId}>
                      <TableRow className="text-admin-softText">
                        <TableCell>
                          <button
                            aria-expanded={isExpanded}
                            aria-controls={`blacklist-detail-${entry.blacklistId}`}
                            className="flex w-full items-center gap-3 rounded-adminControl text-left outline-none hover:text-admin-text focus-visible:ring-4 focus-visible:ring-adminStatus-enabled/20"
                            type="button"
                            onClick={() => toggleEntry(entry)}
                          >
                            <ChevronDown
                              aria-hidden="true"
                              className={`h-6 w-6 shrink-0 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                            <span>
                              <span className="block text-xl font-bold text-admin-text">
                                {entry.displayName}
                              </span>
                              <span className="mt-1 block font-mono text-base text-admin-muted">
                                {entry.activeCode} · {entry.phone ?? "未提供電話"}
                              </span>
                            </span>
                          </button>
                        </TableCell>
                        <TableCell className="font-bold text-red-200">
                          {entry.unredeemedCount} 次
                        </TableCell>
                        <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                        <TableCell>
                          <StatusBadge entry={entry} />
                          {!isActive && entry.releasedAt && (
                            <p className="mt-2 text-base text-admin-muted">
                              {formatDateTime(entry.releasedAt)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            className="h-11 border-red-400 bg-red-400 px-4 text-base font-bold text-slate-100 hover:bg-red-500 hover:text-slate-100"
                            disabled={!isActive}
                            type="button"
                            variant="destructive"
                            onClick={() => onRelease(entry)}
                          >
                            <Unlock aria-hidden="true" />
                            {isActive ? "解除" : "已解除"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow id={`blacklist-detail-${entry.blacklistId}`}>
                          <TableCell className="bg-admin-bg/60 p-5" colSpan={5}>
                            <UnredeemedScheduleList entry={entry} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 border-t border-admin-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-base text-admin-muted">第 {page} / {totalPages} 頁</p>
        <nav aria-label="黑名單分頁" className="flex items-center gap-2">
          <Button
            className="h-10 border-admin-borderStrong bg-admin-bg text-base text-admin-softText"
            disabled={page === 1 || isLoading}
            type="button"
            variant="outline"
            onClick={() => onPageChange(Math.max(page - 1, 1))}
          >
            上一頁
          </Button>
          {visiblePageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              aria-current={pageNumber === page ? "page" : undefined}
              className={
                pageNumber === page
                  ? "h-10 w-10 bg-adminStatus-enabled text-base text-admin-bg"
                  : "h-10 w-10 border-admin-borderStrong bg-admin-bg text-base text-admin-softText"
              }
              type="button"
              variant={pageNumber === page ? "default" : "outline"}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            className="h-10 border-admin-borderStrong bg-admin-bg text-base text-admin-softText"
            disabled={page === totalPages || isLoading}
            type="button"
            variant="outline"
            onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          >
            下一頁
          </Button>
        </nav>
      </div>
    </section>
  );
}

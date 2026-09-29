import { useEffect, useState } from "react";
import { Search, ShieldX } from "lucide-react";
import {
  getBlacklistEntries,
  releaseBlacklistEntry,
  type BlacklistEntry,
  type BlacklistStatus,
} from "../../api/admin/blacklist";
import { BlacklistTable } from "../components/BlacklistTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Toast, type ToastMessage } from "../../components/Toast";

type StatusFilter = BlacklistStatus | "ALL";

const PAGE_SIZE = 5;
const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "全部狀態" },
  { value: "ACTIVE", label: "限制中" },
  { value: "RELEASED", label: "已解除" },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function BlacklistManagementPage() {
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ACTIVE");
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [removingEntry, setRemovingEntry] = useState<BlacklistEntry | null>(
    null,
  );
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);

  useEffect(() => {
    let isCurrent = true;

    async function loadEntries() {
      try {
        setIsLoading(true);
        setError("");
        const result = await getBlacklistEntries({
          keyword,
          status,
          page,
          pageSize: PAGE_SIZE,
        });
        if (!isCurrent) return;

        setEntries(result.items);
        setTotalCount(result.totalCount);
      } catch (requestError) {
        if (!isCurrent) return;
        setEntries([]);
        setTotalCount(0);
        setError(getErrorMessage(requestError, "黑名單讀取失敗。"));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadEntries();
    return () => {
      isCurrent = false;
    };
  }, [keyword, page, refreshKey, status]);

  const handleRemove = async () => {
    if (!removingEntry) return;

    try {
      setIsRemoving(true);
      setError("");
      await releaseBlacklistEntry(removingEntry.blacklistId);
      setRemovingEntry(null);
      setPage(1);
      setToast({ type: "success", message: "黑名單狀態已改為已解除。" });
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "解除黑名單失敗。"));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="admin-panel-body p-4 sm:p-5">
        <form
          className="mt-5 grid gap-3 border-t border-admin-border pt-4 md:grid-cols-[minmax(0,1fr)_180px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setKeyword(keywordInput.trim());
          }}
        >
          <label className="sr-only" htmlFor="blacklist-keyword">
            搜尋黑名單
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted"
            />
            <Input
              id="blacklist-keyword"
              className="h-11 border-admin-borderStrong bg-admin-bg pl-10 text-admin-text focus-visible:ring-adminStatus-enabled"
              placeholder="搜尋姓名、識別碼或電話"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
            />
          </div>
          <label className="sr-only" htmlFor="blacklist-status">
            黑名單狀態
          </label>
          <select
            id="blacklist-status"
            className="h-11 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-sm font-semibold text-admin-text outline-none focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/15"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as StatusFilter);
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            className="h-11 border-admin-borderStrong bg-admin-elevated px-5 font-bold text-admin-text hover:bg-admin-elevated/70"
            type="submit"
            variant="outline"
          >
            查詢
          </Button>
        </form>

        {error && (
          <p
            className="mt-4 rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}
      </section>

      <BlacklistTable
        entries={entries}
        isLoading={isLoading}
        page={page}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
        onRelease={setRemovingEntry}
      />

      <AlertDialog
        open={Boolean(removingEntry)}
        onOpenChange={(open) => {
          if (!open && !isRemoving) setRemovingEntry(null);
        }}
      >
        <AlertDialogContent className="!max-w-md !border-admin-borderStrong !bg-admin-surface !text-admin-text shadow-adminPanel">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-400/15 text-red-200">
              <ShieldX aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle className="!text-xl !font-bold !text-admin-text">
              確定解除黑名單？
            </AlertDialogTitle>
            <AlertDialogDescription className="!text-base !leading-7 !text-admin-muted">
              解除後，{removingEntry?.displayName}
              將可再次建立班次預約；原紀錄會保留，狀態改為已解除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!border-admin-border !bg-admin-elevated/40">
            <AlertDialogCancel
              className="h-11 border-admin-borderStrong bg-admin-surface font-bold text-admin-softText hover:bg-admin-elevated hover:text-admin-text"
              disabled={isRemoving}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 bg-red-500 font-bold text-white hover:bg-red-600"
              disabled={isRemoving}
              variant="destructive"
              onClick={() => void handleRemove()}
            >
              {isRemoving ? "處理中…" : "確認解除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

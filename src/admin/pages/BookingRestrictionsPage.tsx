import { useEffect, useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  getBookingRestrictionSummary,
  getBookingRestrictionUsers,
  getBookingRestrictionUser,
  releaseBookingRestriction,
  type BookingRestrictionStatus,
  type BookingRestrictionSummary,
  type BookingRestrictionUser,
  type BookingRestrictionUserDetail,
} from "../../api/admin/bookingRestrictions";
import { getAdminSession } from "../../api/admin/session";
import { BookingRestrictionTable } from "../components/BookingRestrictionTable";
import { BookingRestrictionDetailDialog } from "../components/BookingRestrictionDetailDialog";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Toast, type ToastMessage } from "../../components/Toast";
import { getPreviewUsers, previewSummary, previewUserDetail } from "../data/bookingRestrictionPreview";

const PAGE_SIZE = 20;
const DEFAULT_REASON = "乘客來電說明，經確認提前解除限制";
type StatusFilter = BookingRestrictionStatus | "ALL";
type ReleaseTarget = { restrictionId: string; displayName: string; activeCode: string };

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) return error.response?.data?.message || fallback;
  return error instanceof Error ? error.message : fallback;
}

export function BookingRestrictionsPage() {
  const { search } = useLocation();
  const isPreview = import.meta.env.DEV && new URLSearchParams(search).get("preview") === "blacklist";
  const [summary, setSummary] = useState<BookingRestrictionSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<BookingRestrictionUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BookingRestrictionUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [releaseTarget, setReleaseTarget] = useState<ReleaseTarget | null>(null);
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [releaseError, setReleaseError] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const canRelease = isPreview || getAdminSession()?.role === "ADMIN";

  const openReleaseDialog = (target: ReleaseTarget) => {
    setReason(DEFAULT_REASON);
    setReleaseError("");
    setReleaseTarget(target);
  };

  useEffect(() => {
    let current = true;
    setSummaryError("");
    void (isPreview ? Promise.resolve(previewSummary) : getBookingRestrictionSummary()).then((value) => {
      if (current) setSummary(value);
    }).catch((error: unknown) => {
      if (current) { setSummary(null); setSummaryError(errorMessage(error, "統計讀取失敗。")); }
    });
    return () => { current = false; };
  }, [isPreview, refreshKey]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setListError("");
    const query = { keyword: keyword || undefined, status: status === "ALL" ? undefined : status, page, pageSize: PAGE_SIZE };
    void (isPreview ? Promise.resolve(getPreviewUsers(query)) : getBookingRestrictionUsers(query))
      .then((value) => {
        if (!current) return;
        setUsers(value.items);
        setTotalCount(value.totalCount);
        setTotalPages(Math.max(1, value.totalPages));
      }).catch((error: unknown) => {
        if (!current) return;
        setUsers([]); setTotalCount(0); setTotalPages(1);
        setListError(errorMessage(error, "列表讀取失敗。"));
      }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [isPreview, keyword, status, page, refreshKey]);

  useEffect(() => {
    if (!selectedUserId) { setDetail(null); return; }
    let current = true;
    setDetail(null); setDetailLoading(true); setDetailError("");
    void (isPreview ? Promise.resolve(previewUserDetail) : getBookingRestrictionUser(selectedUserId)).then((value) => {
      if (current) setDetail(value);
    }).catch((error: unknown) => {
      if (current) setDetailError(errorMessage(error, "會員明細讀取失敗。"));
    }).finally(() => { if (current) setDetailLoading(false); });
    return () => { current = false; };
  }, [isPreview, selectedUserId, refreshKey]);

  const handleRelease = async () => {
    const trimmedReason = reason.trim();
    if (!canRelease || isPreview || !releaseTarget) return;
    if (!trimmedReason || trimmedReason.length > 1000) {
      setReleaseError("請輸入 1 至 1000 字的解除原因。"); return;
    }
    setReleasing(true); setReleaseError("");
    try {
      await releaseBookingRestriction(releaseTarget.restrictionId, trimmedReason);
      setReleaseTarget(null);
      setToast({ type: "success", message: "黑名單已解除。" });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setReleaseError(axios.isAxiosError(error) && error.response?.status === 409
        ? "此限制已解除或已到期，請重新整理列表。"
        : errorMessage(error, "解除黑名單失敗。"));
    } finally { setReleasing(false); }
  };

  return <div className="space-y-4">
    <section className="admin-panel-body p-4 sm:p-5">
      {isPreview && <p className="mb-4 rounded-adminControl border border-admin-borderStrong bg-admin-elevated px-3 py-2 text-sm text-admin-text">測試資料預覽：王先生（16486670），狀態為限制中。此頁不會讀取或修改後端資料。</p>}
      <div aria-live="polite" className="text-base text-admin-softText">
        {summary ? <div className="flex flex-wrap gap-x-5 gap-y-1">
          <p>限制中：{summary.blockedCount}</p><p>警示：{summary.warningCount}</p>
          <p>警示 1 次：{summary.warningOneCount}</p><p>警示 2 次：{summary.warningTwoCount}</p>
          <p>今日提前解除：{summary.releasedTodayCount}</p>
        </div> : !summaryError && <p>統計讀取中…</p>}
        {summaryError && <p role="alert" className="text-red-300">{summaryError}</p>}
      </div>
      <form className="mt-4 grid gap-3 border-t border-admin-border pt-4 md:grid-cols-[minmax(0,1fr)_180px_auto]" onSubmit={(event) => {
        event.preventDefault(); setPage(1); setKeyword(keywordInput.trim());
      }}>
        <label className="sr-only" htmlFor="restriction-keyword">搜尋會員代碼、姓名或電話</label>
        <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
          <Input id="restriction-keyword" className="h-11 border-admin-borderStrong bg-admin-bg pl-10 text-admin-text" placeholder="搜尋會員代碼、姓名或電話" value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} />
        </div>
        <label className="sr-only" htmlFor="restriction-status">限制狀態</label>
        <select id="restriction-status" className="h-11 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-admin-text focus-visible:ring-2 focus-visible:ring-adminStatus-enabled" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as StatusFilter); }}>
          <option value="ALL">全部狀態</option><option value="NORMAL">正常</option><option value="WARNING">警示</option><option value="BLOCKED">限制中</option>
        </select>
        <Button type="submit" variant="outline" className="h-11 border-admin-borderStrong bg-admin-elevated text-admin-text">查詢</Button>
      </form>
      {listError && <p role="alert" className="mt-4 text-red-300">{listError}</p>}
    </section>
    <BookingRestrictionTable users={users} loading={loading} page={page} totalCount={totalCount} totalPages={totalPages} canRelease={canRelease} onPageChange={setPage} onSelect={setSelectedUserId} onRelease={(user) => {
      if (user.status === "BLOCKED" && user.currentRestrictionId) openReleaseDialog({ restrictionId: user.currentRestrictionId, displayName: user.displayName, activeCode: user.activeCode });
    }} />
    <BookingRestrictionDetailDialog userId={selectedUserId} detail={detail} loading={detailLoading} error={detailError} canRelease={canRelease} onClose={() => setSelectedUserId(null)} onRelease={() => {
      if (detail?.state.status === "BLOCKED" && detail.currentRestriction?.status === "ACTIVE") openReleaseDialog({ restrictionId: detail.currentRestriction.restrictionId, displayName: detail.user.displayName, activeCode: detail.user.activeCode });
    }} />
    <Dialog open={Boolean(releaseTarget)} onOpenChange={(open) => { if (!open && !releasing) setReleaseTarget(null); }}>
      <DialogContent className="!bg-admin-surface !text-admin-text" closeButtonClassName="bg-admin-elevated text-admin-text hover:bg-admin-borderStrong hover:text-white focus-visible:ring-adminStatus-enabled">
        <DialogHeader><DialogTitle className="!text-admin-text">確認解除黑名單？</DialogTitle><DialogDescription className="!text-admin-muted">{releaseTarget?.displayName}（{releaseTarget?.activeCode}）將恢復正常預約。請確認解除原因，送出後會通知後端。</DialogDescription></DialogHeader>
        <label htmlFor="release-reason">解除原因</label>
        <textarea id="release-reason" value={reason} maxLength={1000} required rows={4} className="w-full rounded-lg border border-admin-borderStrong bg-admin-bg p-3 text-admin-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-adminStatus-enabled" onChange={(event) => setReason(event.target.value)} />
        <p className="text-right text-sm text-admin-muted">{reason.length} / 1000</p>
        {isPreview && <p className="text-sm text-admin-muted">這是測試資料預覽，無法送出解除請求。</p>}
        {releaseError && <p role="alert" className="text-red-300">{releaseError}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={releasing} onClick={() => setReleaseTarget(null)}>取消</Button><Button type="button" disabled={isPreview || releasing || !reason.trim()} onClick={() => void handleRelease()}>{releasing ? "處理中…" : "確認解除"}</Button></div>
      </DialogContent>
    </Dialog>
    <Toast toast={toast} onClose={() => setToast(null)} />
  </div>;
}

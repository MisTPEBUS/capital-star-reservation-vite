import type { BookingRestrictionUserDetail } from "../../api/admin/bookingRestrictions";
import { UserCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { formatTaipeiDateTime, formatTaipeiRocDate, restrictionStatusLabel } from "./BookingRestrictionTable";

interface Props {
  userId: string | null;
  detail: BookingRestrictionUserDetail | null;
  loading: boolean;
  error: string;
  canRelease: boolean;
  onClose: () => void;
  onRelease: () => void;
}

export function BookingRestrictionDetailDialog({ userId, detail, loading, error, canRelease, onClose, onRelease }: Props) {
  return <Dialog open={Boolean(userId)} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="!flex !max-h-[90dvh] !max-w-3xl !flex-col !gap-0 !overflow-hidden !bg-admin-surface !p-0 !text-admin-text" closeButtonClassName="bg-admin-elevated text-admin-text hover:bg-admin-borderStrong hover:text-white focus-visible:ring-adminStatus-enabled">
      <DialogHeader className="shrink-0 border-b border-admin-border px-5 py-4 pr-12 sm:px-6 sm:pr-12">
        <DialogTitle className="!text-admin-text">{detail?.state.status === "BLOCKED" ? "黑名單明細" : "會員預約限制明細"}</DialogTitle>
        <DialogDescription className="!text-admin-muted">本輪未搭乘紀錄與歷次限制</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
      {loading && <p role="status">讀取中…</p>}
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {detail && <div className="space-y-5 text-base">
        <div className="rounded-lg border border-admin-border p-4">
          <h3 className="font-bold">{detail.user.displayName} <span className="font-mono font-normal">{detail.user.activeCode}</span></h3>
          <p className="text-admin-muted">電話：{detail.user.phone ?? "未提供"}</p>
          <p>狀態：{restrictionStatusLabel[detail.state.status]} · 本輪未搭乘 {detail.state.noShowCount} 次</p>
          <p>最近未搭乘：{formatTaipeiRocDate(detail.state.lastNoShowAt)}</p>
          <p>上次重置：{formatTaipeiDateTime(detail.state.lastResetAt)}</p>
          {detail.currentRestriction && <p>限制期間：{formatTaipeiDateTime(detail.currentRestriction.restrictedAt)} 至 {formatTaipeiDateTime(detail.currentRestriction.restrictedUntil)}</p>}
        </div>
        <section>
          <h3 className="mb-2 font-bold">本輪未搭乘紀錄</h3>
          {detail.currentNoShowReservations.length === 0 ? <p className="text-admin-muted">目前沒有紀錄</p> : <ul className="space-y-2">
            {detail.currentNoShowReservations.map((item) => <li key={item.reservationId} className="rounded-lg border border-admin-border p-3">
              <p>{item.openDate} {item.departureTime} · 路線 {item.routeNumber}</p>
              <p className="text-admin-muted">{item.pickupStopName} · 判定時間 {formatTaipeiDateTime(item.determinedNoShowAt)}</p>
            </li>)}
          </ul>}
        </section>
        <section>
          <h3 className="mb-2 font-bold">歷次限制</h3>
          {detail.restrictionHistory.length === 0 ? <p className="text-admin-muted">目前沒有紀錄</p> : <ul className="space-y-2">
            {detail.restrictionHistory.map((item) => <li key={item.restrictionId} className="rounded-lg border border-admin-border p-3">
              <p>{formatTaipeiDateTime(item.restrictedAt)} 至 {formatTaipeiDateTime(item.restrictedUntil)} · {item.status} · {item.triggerCount} 次</p>
              {item.releasedAt && <p>提前解除：{formatTaipeiDateTime(item.releasedAt)} · {item.releasedByName ?? "管理員"}</p>}
              {item.releaseReason && <p>原因：{item.releaseReason}</p>}
            </li>)}
          </ul>}
        </section>
      </div>}
      </div>
      <DialogFooter className="shrink-0 border-t border-admin-border px-5 py-4 sm:px-6">
        <Button type="button" variant="outline" onClick={onClose}>關閉</Button>
        {canRelease && detail?.currentRestriction?.status === "ACTIVE" && <Button type="button" className="gap-2 bg-red-500 text-white hover:bg-red-600" onClick={onRelease}><UserCheck aria-hidden="true" className="h-4 w-4" />解除黑名單</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

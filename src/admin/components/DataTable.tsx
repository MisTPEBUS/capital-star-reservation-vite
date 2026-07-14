import type { AdminReservationListItem } from "../types/admin";

interface DataTableProps {
  reservations: Array<AdminReservationListItem & { departureTime: string }>;
}

export function DataTable({ reservations }: DataTableProps) {
  if (reservations.length === 0) {
    return (
      <div className="rounded-adminControl border border-dashed border-admin-borderStrong px-3 py-8 text-center text-sm text-admin-muted">
        目前沒有乘客預約資料。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-admin-border text-xs text-admin-muted">
          <tr>
            <th className="px-3 py-2.5 font-semibold">班次</th>
            <th className="px-3 py-2.5 font-semibold">序號</th>
            <th className="px-3 py-2.5 font-semibold">乘客</th>
            <th className="px-3 py-2.5 font-semibold">識別碼</th>
            <th className="px-3 py-2.5 font-semibold">上車站</th>
            <th className="px-3 py-2.5 font-semibold">預約時間</th>

            <th className="px-3 py-2.5 font-semibold">狀態</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {reservations.map((reservation) => (
            <tr key={reservation.reservationId} className="text-admin-softText">
              <td className="px-3 py-3 font-semibold text-admin-text">
                {reservation.departureTime}
              </td>
              <td className="px-3 py-3">
                {String(reservation.sequence).padStart(2, "0")}
              </td>
              <td className="px-3 py-3">
                <p className="font-semibold text-admin-text">
                  {reservation.name}
                </p>
                <p className="mt-1 text-xs text-admin-muted">
                  LINE：{reservation.lineDisplayName}
                </p>
              </td>
              <td className="px-3 py-3 font-mono">{reservation.activeCode}</td>
              <td className="px-3 py-3">{reservation.pickupStopName}</td>
              <td className="px-3 py-3">{reservation.bookedAt}</td>
              <td className="px-3 py-3">
                <span
                  className={
                    reservation.status === "RESERVED"
                      ? "font-semibold text-adminStatus-enabled"
                      : "font-semibold text-admin-muted"
                  }
                >
                  {reservation.status === "RESERVED" ? "已預約" : "已取消"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

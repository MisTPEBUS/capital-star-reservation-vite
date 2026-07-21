import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { AdminReservationListItem } from "../types/admin";

type ReservationRow = AdminReservationListItem & { departureTime: string };

interface DataTableProps {
  reservations: ReservationRow[];
  newReservation: { name: string; phone: string; passengerCount: number } | null;
  isCreating?: boolean;
  onNewReservationChange: (
    value: { name: string; phone: string; passengerCount: number },
  ) => void;
  onCreate: () => void;
  onCancelCreate: () => void;
  editingReservation: {
    reservationId: string;
    name: string;
    phone: string;
    passengerCount: number;
    pickupStopId: string | null;
  } | null;
  isUpdating?: boolean;
  deletingReservationId?: string | null;
  onStartEdit: (reservation: ReservationRow) => void;
  onEditingReservationChange: (value: {
    reservationId: string;
    name: string;
    phone: string;
    passengerCount: number;
    pickupStopId: string | null;
  }) => void;
  onUpdate: () => void;
  onCancelEdit: () => void;
  onDelete: (reservation: ReservationRow) => void;
}

function getColumns({
  editingReservation,
  isUpdating,
  deletingReservationId,
  onStartEdit,
  onEditingReservationChange,
  onUpdate,
  onCancelEdit,
  onDelete,
}: Pick<
  DataTableProps,
  | "editingReservation"
  | "isUpdating"
  | "deletingReservationId"
  | "onStartEdit"
  | "onEditingReservationChange"
  | "onUpdate"
  | "onCancelEdit"
  | "onDelete"
>): ColumnDef<ReservationRow>[] {
  const isEditing = (reservationId: string) =>
    editingReservation?.reservationId === reservationId;

  return [
  {
    accessorKey: "departureTime",
    header: "班次",
    cell: ({ getValue }) => (
      <span className="font-semibold text-admin-text">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "電話",
    cell: ({ row }) =>
      editingReservation?.reservationId === row.original.reservationId ? (
        <input
          aria-label="電話"
          className="h-9 w-32 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-2 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
          value={editingReservation.phone}
          onChange={(event) =>
            onEditingReservationChange({
              ...editingReservation!,
              phone: event.target.value,
            })
          }
        />
      ) : (
        row.original.phone
      ),
  },
  {
    accessorKey: "sequence",
    header: "序號",
    cell: ({ getValue }) => String(getValue<number>()).padStart(2, "0"),
  },
  {
    accessorKey: "passengerCount",
    header: "人數",
    cell: ({ row, getValue }) =>
      editingReservation?.reservationId === row.original.reservationId ? (
        <input
          aria-label="搭乘人數"
          className="h-9 w-20 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-2 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
          min="1"
          type="number"
          value={editingReservation.passengerCount}
          onChange={(event) =>
            onEditingReservationChange({
              ...editingReservation!,
              passengerCount: Number(event.target.value),
            })
          }
        />
      ) : (
        `${getValue<number>()} 人`
      ),
  },
  {
    accessorKey: "name",
    header: "乘客",
    cell: ({ row }) =>
      editingReservation?.reservationId === row.original.reservationId ? (
        <input
          aria-label="姓名"
          className="h-9 w-28 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-2 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
          value={editingReservation.name}
          onChange={(event) =>
            onEditingReservationChange({
              ...editingReservation!,
              name: event.target.value,
            })
          }
        />
      ) : (
        <>
          <p className="font-semibold text-admin-text">{row.original.name}</p>
          <p className="mt-1 text-sm text-admin-muted">
            LINE：{row.original.lineDisplayName}
          </p>
        </>
      ),
  },
  {
    accessorKey: "activeCode",
    header: "識別碼",
    cell: ({ getValue }) => <span className="font-mono">{getValue<string>()}</span>,
  },
  { accessorKey: "pickupStopName", header: "上車站" },
  { accessorKey: "bookedAt", header: "預約時間" },
  {
    accessorKey: "status",
    header: "狀態",
    cell: ({ getValue }) => {
      const status = getValue<string>();

      return (
        <span
          className={
            status === "RESERVED"
              ? "font-semibold text-adminStatus-enabled"
              : "font-semibold text-admin-muted"
          }
        >
          {status === "RESERVED" ? "已預約" : "已取消"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const reservation = row.original;

      if (!reservation.isAdminCreated) return "-";

      if (isEditing(reservation.reservationId)) {
        return (
          <div className="flex gap-2">
            <button
              className="text-sm font-bold text-adminStatus-enabled disabled:opacity-50"
              disabled={isUpdating}
              type="button"
              onClick={onUpdate}
            >
              {isUpdating ? "儲存中…" : "儲存"}
            </button>
            <button
              className="text-sm font-bold text-admin-muted"
              disabled={isUpdating}
              type="button"
              onClick={onCancelEdit}
            >
              取消
            </button>
          </div>
        );
      }

      return (
        <div className="flex gap-2">
          <button
            className="text-sm font-bold text-adminStatus-enabled"
            type="button"
            onClick={() => onStartEdit(reservation)}
          >
            修改
          </button>
          <button
            className="text-sm font-bold text-red-300 disabled:opacity-50"
            disabled={deletingReservationId === reservation.reservationId}
            type="button"
            onClick={() => onDelete(reservation)}
          >
            {deletingReservationId === reservation.reservationId ? "刪除中…" : "刪除"}
          </button>
        </div>
      );
    },
  },
];
}

export function DataTable({
  reservations,
  newReservation,
  isCreating = false,
  onNewReservationChange,
  onCreate,
  onCancelCreate,
  editingReservation,
  isUpdating = false,
  deletingReservationId = null,
  onStartEdit,
  onEditingReservationChange,
  onUpdate,
  onCancelEdit,
  onDelete,
}: DataTableProps) {
  const table = useReactTable({
    data: reservations,
    columns: getColumns({
      editingReservation,
      isUpdating,
      deletingReservationId,
      onStartEdit,
      onEditingReservationChange,
      onUpdate,
      onCancelEdit,
      onDelete,
    }),
    getCoreRowModel: getCoreRowModel(),
  });

  if (reservations.length === 0 && !newReservation) {
    return (
      <div className="rounded-adminControl border border-dashed border-admin-borderStrong px-3 py-8 text-center text-base text-admin-muted">
        目前沒有乘客預約資料。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-base">
        <thead className="border-b border-admin-border text-sm text-admin-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-3 py-2.5 font-semibold">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-admin-border">
          {newReservation && (
            <tr className="bg-adminStatus-enabled/5 text-admin-softText">
              <td className="px-3 py-3 text-admin-muted">-</td>
              <td className="px-3 py-3">
                <input
                  aria-label="電話"
                  className="h-9 w-32 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-2 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
                  inputMode="tel"
                  placeholder="電話"
                  value={newReservation.phone}
                  onChange={(event) =>
                    onNewReservationChange({ ...newReservation, phone: event.target.value })
                  }
                />
              </td>
              <td className="px-3 py-3 font-semibold text-adminStatus-enabled">新增</td>
              <td className="px-3 py-3">
                <input
                  aria-label="搭乘人數"
                  className="h-9 w-20 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-2 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
                  min="1"
                  type="number"
                  value={newReservation.passengerCount}
                  onChange={(event) =>
                    onNewReservationChange({
                      ...newReservation,
                      passengerCount: Number(event.target.value),
                    })
                  }
                />
              </td>
              <td className="px-3 py-3">
                <input
                  aria-label="姓名"
                  className="h-9 w-28 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-2 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
                  placeholder="姓名"
                  value={newReservation.name}
                  onChange={(event) =>
                    onNewReservationChange({ ...newReservation, name: event.target.value })
                  }
                />
              </td>
              <td className="px-3 py-3 text-admin-muted">-</td>
              <td className="px-3 py-3 text-admin-muted">-</td>
              <td className="px-3 py-3 text-admin-muted">-</td>
              <td className="px-3 py-3 text-admin-muted">-</td>
              <td className="px-3 py-3">
                <div className="flex gap-2">
                  <button
                    className="h-9 rounded-adminControl bg-adminStatus-enabled px-3 text-sm font-bold text-admin-bg disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isCreating}
                    type="button"
                    onClick={onCreate}
                  >
                    {isCreating ? "送出中…" : "送出"}
                  </button>
                  <button
                    className="h-9 rounded-adminControl border border-admin-borderStrong px-3 text-sm font-bold text-admin-softText"
                    disabled={isCreating}
                    type="button"
                    onClick={onCancelCreate}
                  >
                    取消
                  </button>
                </div>
              </td>
            </tr>
          )}
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="text-admin-softText">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

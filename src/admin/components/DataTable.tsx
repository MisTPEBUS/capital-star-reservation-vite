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
}

const columns: ColumnDef<ReservationRow>[] = [
  {
    accessorKey: "departureTime",
    header: "班次",
    cell: ({ getValue }) => (
      <span className="font-semibold text-admin-text">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "sequence",
    header: "序號",
    cell: ({ getValue }) => String(getValue<number>()).padStart(2, "0"),
  },
  {
    accessorKey: "name",
    header: "乘客",
    cell: ({ row }) => (
      <>
        <p className="font-semibold text-admin-text">{row.original.name}</p>
        <p className="mt-1 text-xs text-admin-muted">
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
];

export function DataTable({ reservations }: DataTableProps) {
  const table = useReactTable({
    data: reservations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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

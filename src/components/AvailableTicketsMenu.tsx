import { FaTicketAlt } from "react-icons/fa";
import { FiChevronRight, FiClock } from "react-icons/fi";
import type { UpcomingReservation } from "../api/reservations";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";

interface AvailableTicketsMenuProps {
  reservations: UpcomingReservation[];
  isLoading: boolean;
  onSelect: (reservation: UpcomingReservation) => void;
}

const ONE_HOUR = 60 * 60 * 1000;

export function getReservationDepartureTimestamp(
  reservation: UpcomingReservation,
) {
  const dateMatch = reservation.openDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = reservation.departureTime.match(/^(\d{1,2}):(\d{2})/);

  if (!dateMatch || !timeMatch) return Number.NaN;

  return new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  ).getTime();
}

export function isTicketUsable(
  reservation: UpcomingReservation,
  now = Date.now(),
) {
  const departureAt = getReservationDepartureTimestamp(reservation);

  return (
    reservation.status === "RESERVED" &&
    Number.isFinite(departureAt) &&
    now >= departureAt - ONE_HOUR &&
    now <= departureAt + ONE_HOUR
  );
}

export function AvailableTicketsMenu({
  reservations,
  isLoading,
  onSelect,
}: AvailableTicketsMenuProps) {
  const recentReservationItems = [...reservations]
    .sort(
      (left, right) =>
        getReservationDepartureTimestamp(right) -
        getReservationDepartureTimestamp(left),
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`近期預約記錄 ${recentReservationItems.length} 筆`}
          className="fixed right-4 top-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-bus-100 bg-white text-bus-800 shadow-lift transition hover:bg-bus-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bus-200"
        >
          <FaTicketAlt className="h-5 w-5" aria-hidden="true" />
          {recentReservationItems.length > 0 && (
            <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-black leading-5 text-white ring-2 ring-white">
              {recentReservationItems.length > 99 ? "99+" : recentReservationItems.length}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={10}
        className="w-[min(25rem,calc(100vw-2rem))] !bg-white p-0 opacity-100 shadow-[0_18px_48px_rgba(7,43,80,0.28)] ring-1 ring-bus-100"
      >
        <div className="rounded-t-lg bg-bus-900 px-4 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-black">近期預約記錄</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="max-h-[22rem] overflow-y-auto bg-white p-3">
          {isLoading ? (
            <p className="py-8 text-center text-sm font-medium text-ink-500">
              正在讀取預約紀錄…
            </p>
          ) : recentReservationItems.length === 0 ? (
            <div className="py-8 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-ink-50 text-ink-400">
                <FaTicketAlt aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-black text-ink-700">
                目前沒有近期預約紀錄
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentReservationItems.map((reservation) => (
                <Button
                  key={reservation.reservationId}
                  type="button"
                  variant="outline"
                  onClick={() => onSelect(reservation)}
                  className="h-auto w-full justify-start rounded-xl border-bus-100 bg-white p-3 text-left shadow-sm hover:border-bus-300 hover:bg-bus-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink-500">
                      {reservation.openDate}　{reservation.routeNumber} · {reservation.pickupStop.stopName}
                    </span>
                    <span className="mt-1 block font-mono text-3xl font-black leading-none tracking-tight text-ink-900">
                      {reservation.departureTime.slice(0, 5)}
                    </span>
                  </span>
                  <FiChevronRight
                    className="shrink-0 text-ink-400"
                    aria-hidden="true"
                  />
                </Button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

import { FiChevronRight, FiClock } from "react-icons/fi";
import type { UpcomingReservation } from "../api/reservations";
import { SectionTitle } from "./SectionTitle";
import { Button } from "./ui/button";

interface AvailableTicketsMenuProps {
  reservations: UpcomingReservation[];
  isLoading: boolean;
  onSelect: (reservation: UpcomingReservation) => void;
}

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

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
    .filter((reservation) => {
      const departureAt = getReservationDepartureTimestamp(reservation);

      return (
        Number.isFinite(departureAt) && departureAt >= Date.now() - ONE_DAY
      );
    })
    .sort(
      (left, right) =>
        getReservationDepartureTimestamp(right) -
        getReservationDepartureTimestamp(left),
    );

  return (
    <section className="rounded-panel bg-white p-4 shadow-card ring-1 ring-bus-100/80 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle
          eyebrow="預約紀錄"
          title=""
          description="顯示最近 24 小時內的出發班次。"
        />
      </div>

      <div className="max-h-[22rem] overflow-y-auto border-t border-bus-100 pt-3 md:pt-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm font-medium text-ink-500">
            正在讀取預約紀錄…
          </p>
        ) : recentReservationItems.length === 0 ? (
          <div className="rounded-card bg-ink-50 px-4 py-8 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-bus-50 text-xl text-bus-600">
              <FiClock aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-black text-ink-700">
              目前沒有近期預約紀錄
            </p>
            <p className="mt-1 text-sm font-bold text-ink-500">
              最近 24 小時內沒有可查看的班次。
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
                className="group h-auto w-full justify-start rounded-2xl border-bus-100 bg-ink-50 p-3 text-left shadow-none transition hover:border-bus-300 hover:bg-bus-50 hover:shadow-sm"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-bus-600 text-xl font-black text-white shadow-sm">
                  <FiClock aria-hidden="true" />
                </span>
                <span className="ml-3 min-w-0 flex-1">
                  <span className="block text-base font-bold text-ink-500">
                    {reservation.openDate} ·{" "}
                    {reservation.departureTime.slice(0, 5)}
                  </span>
                  <span className="mt-1 flex min-w-0 items-baseline gap-2">
                    <span className="font-mono text-3xl font-black leading-none tracking-tight text-ink-900">
                      {reservation.routeNumber}
                    </span>
                    <span className="truncate text-xl font-bold text-bus-700">
                      {reservation.pickupStop.stopName}
                    </span>
                  </span>
                </span>
                <FiChevronRight
                  className="shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-bus-600"
                  aria-hidden="true"
                />
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

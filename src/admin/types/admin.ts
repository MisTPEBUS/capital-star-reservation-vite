export interface AdminReservationListItem {
  reservationId: string;
  sequence: number;
  lineDisplayName: string;
  activeCode: string;
  phone: string;
  pickupStopName: string;
  bookedAt: string;
  status: "RESERVED" | "CANCELLED";
}

export interface PickupStopReservationSummary {
  pickupStopName: string;
  reservedCount: number;
}

export interface AdminScheduleSummary {
  dailyOpenScheduleId: string;
  scheduleName: string;
  openDate: string;
  departureTime: string;
  quota: number;
  reservedCount: number;
  cancelledCount: number;
  availableSeats: number;
  pickupStopSummaries: PickupStopReservationSummary[];
  reservations: AdminReservationListItem[];
}

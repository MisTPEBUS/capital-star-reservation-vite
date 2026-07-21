export interface AdminReservationListItem {
  reservationId: string;
  sequence: number;
  passengerCount: number;
  name: string;
  lineDisplayName: string;
  activeCode: string;
  phone: string;
  pickupStopId: string | null;
  pickupStopName: string;
  isAdminCreated: boolean;
  bookedAt: string;
  cancelledAt?: string;
  status: "RESERVED" | "CANCELLED" | string;
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
  reservedPassengerCount?: number;
  cancelledCount: number;
  cancelledPassengerCount?: number;
  availableSeats: number;
  pickupStopSummaries: PickupStopReservationSummary[];
  reservations: AdminReservationListItem[];
}

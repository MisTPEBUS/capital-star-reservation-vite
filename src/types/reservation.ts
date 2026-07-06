export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ReservationStatus = 'RESERVED' | 'CANCELLED' | null;
export type TimePeriod = 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface PassengerProfile {
  userId: string;
  displayName: string;
  firstName?: string | null;
  sex?: string | null;
  activeCode: string;
  phoneNumber: string;
  email: string | null;
  status: UserStatus;
  membershipLabel: string;
}

export interface PickupStop {
  stopId: string;
  stopName: string;
  stopType: 'MAIN_STATION' | 'ROADSIDE' | 'TRANSIT';
  address: string;
  shortLabel: string;
}

export interface RouteInfo {
  routeId: string;
  routeNumber: string;
  routeName: string;
  description: string;
  stops: PickupStop[];
}

export interface OpenSchedule {
  dailyOpenScheduleId: string;
  routeId: string;
  scheduleCode: string;
  departureTime: string;
  openDate: string;
  pickupStopIds: string[];
  quota: number;
  reservedCount: number;
  availableSeats: number;
  bookingDeadline: string;
  userReservation: ReservationStatus;
  note: string;
}

export interface BookingSelection {
  routeId: string;
  pickupStopId: string;
  openDate: string;
  timePeriod: TimePeriod;
}

export interface ReservationResult {
  reservationId: string;
  scheduleCode: string;
  departureTime: string;
  openDate: string;
  pickupStopName: string;
  activeCode: string;
  passengerName: string;
  bookedAt: string;
  qrCode?: string;
}

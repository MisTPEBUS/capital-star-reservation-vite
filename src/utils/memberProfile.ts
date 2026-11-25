import {
  getPreferredProfileName,
  getSexTitle,
  type AuthProfile,
} from "../api/auth";
import { passengerProfile } from "../data/mockData";
import type { LiffProfile } from "../liff/liffClient";
import type { PassengerProfile } from "../types/reservation";

export function getDisplayPassengerProfile(
  authProfile: AuthProfile | null,
  liffProfile: LiffProfile | null,
): PassengerProfile {
  return {
    ...passengerProfile,
    userId: authProfile?.userId ?? passengerProfile.userId,
    displayName: authProfile
      ? getPreferredProfileName(
          authProfile,
          liffProfile?.displayName ?? passengerProfile.displayName,
        )
      : (liffProfile?.displayName ?? passengerProfile.displayName),
    firstName: authProfile?.firstName ?? null,
    sex: authProfile?.sex ?? null,
    activeCode: authProfile?.activeCode ?? "",
    phoneNumber: authProfile?.phone ?? passengerProfile.phoneNumber,
    email: authProfile?.email ?? passengerProfile.email,
    status: authProfile?.status ?? passengerProfile.status,
  };
}

export function getReservationPassengerName(authProfile: AuthProfile | null) {
  const firstName = authProfile?.firstName?.trim();
  const title = getSexTitle(authProfile?.sex);
  return firstName && title ? `${firstName}${title}` : "";
}

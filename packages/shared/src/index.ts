export type Role = "OWNER" | "WALKER";

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type DurationMinutes = 30 | 60;

export const WALKER_MONTHLY_SUBSCRIPTION_USD = 9;

export interface ZoneDto {
  id: string;
  name: string;
  city: string;
  /** price in cents */
  price30: number;
  /** price in cents */
  price60: number;
}

export interface WalletDto {
  balance: number; // cents
}

export interface BookingDto {
  id: string;
  zoneId: string;
  zoneName: string;
  durationMinutes: DurationMinutes;
  price: number; // cents
  status: BookingStatus;
  walkerId: string | null;
  walkerName: string | null;
  createdAt: string;
}

export function priceForDuration(zone: ZoneDto, duration: DurationMinutes): number {
  return duration === 30 ? zone.price30 : zone.price60;
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

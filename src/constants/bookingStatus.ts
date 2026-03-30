/** Khớp `BookingService.Domain.Enum.BookingStatusEnum` (dùng const object vì `erasableSyntaxOnly`) */

export const BookingStatus = {
  Pending: 0,
  Confirmed: 1,
  Rejected: 2,
  Cancelled: 3,
  Completed: 4,
} as const;

export type BookingStatusValue = (typeof BookingStatus)[keyof typeof BookingStatus];

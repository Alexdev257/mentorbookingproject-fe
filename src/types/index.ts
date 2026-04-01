export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: number; // 1: Admin, 2: Teacher, 3: Student
  avatarUrl?: string;
}

export interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface CommonResponse<T> {
  data: T;
  isSuccess: boolean;
  message: string;
  listErrors: { field: string; detail: string }[];
}

export interface PaginationResponse<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface TokenDTO {
  accessToken: string;
  refreshToken: string;
}

export interface TeacherResponseDto {
  id: string;
  /** Account id (JWT sub) — dùng cho booking/slots; khác với id hồ sơ giáo viên */
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  department: string;
  specialization: string;
  isActive: boolean;
}

export interface StudentResponseDto {
  id: string;
  fullName: string;
  email: string;
  studentCode: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface SlotResponseDto {
  id: string;
  mentorId: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
}

/** `status` = `BookingStatusEnum`: Pending=0, Confirmed=1, Rejected=2, Cancelled=3, Completed=4 */
export interface BookingResponseDto {
  id: string;
  mentorId: string;
  menteeId: string;
  slotId?: string;
  status: number;
  topic?: string;
  notes?: string;
  priceAmount: number;
  currency: string;
  scheduleStart: string;
  scheduleEnd: string;
  meetingLink?: string;
  googleEventId?: string;
  createdAt?: string;
}

/** Review user payload — backend serializes `Fullname` as `fullname` (camelCase). */
export interface ReviewUserDto {
  id?: string;
  email?: string;
  fullName?: string;
  fullname?: string;
  avatarUrl?: string;
}

export interface ReviewResponseDto {
  id: string;
  bookingId: string;
  rating: number;
  comment?: string;
  mentor?: ReviewUserDto;
  mentee?: ReviewUserDto;
}

export interface MeetingListItemDto {
  id: string;
  bookingId: string;
  status: number;
  statusLabel: string;
  provider: string;
  joinUrl?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  recordingsCount: number;
}

export interface MeetingRecordingDto {
  id: string;
  meetingId: string;
  status: number;
  storageUrl: string;
  contentType?: string;
  durationSeconds?: number;
  sizeBytes?: number;
  createdAt: string;
}

export interface MeetingDetailDto {
  id: string;
  bookingId: string;
  status: number;
  statusLabel: string;
  provider: string;
  joinUrl?: string;
  hostUrl?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  recordings: MeetingRecordingDto[];
}

export interface MeetingJoinLinksDto {
  meetingId: string;
  bookingId: string;
  provider: string;
  joinUrl?: string;
  hostUrl?: string;
}

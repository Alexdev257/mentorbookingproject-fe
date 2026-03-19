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

export interface TokenDTO {
  accessToken: string;
  refreshToken: string;
}

export interface TeacherResponseDto {
  id: string;
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
}

export interface ReviewResponseDto {
  id: string;
  bookingId: string;
  rating: number;
  comment?: string;
  mentor?: { fullName: string; email: string };
  mentee?: { fullName: string; email: string };
}

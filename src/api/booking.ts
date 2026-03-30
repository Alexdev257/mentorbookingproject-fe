import api from './axios';
import type { CommonResponse, SlotResponseDto, BookingResponseDto, PaginationResponse } from '../types';

/** Booking + Slots + Zoom — khớp BookingService.Api */

export const bookingApi = {
  // --- Slots: /api/booking/mentors/{mentorId}/slots ---
  getMentorSlots: async (
    mentorId: string,
    params?: { from?: string; to?: string; includeBooked?: boolean }
  ): Promise<CommonResponse<SlotResponseDto[]>> => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.includeBooked) qs.set('includeBooked', 'true');
    const q = qs.toString();
    const url = `/booking/mentors/${mentorId}/slots${q ? `?${q}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  getSlotById: async (mentorId: string, slotId: string): Promise<CommonResponse<SlotResponseDto | null>> => {
    const response = await api.get(`/booking/mentors/${mentorId}/slots/${slotId}`);
    return response.data;
  },

  createSlot: async (
    mentorId: string,
    data: { startAt: string; endAt: string }
  ): Promise<CommonResponse<SlotResponseDto>> => {
    const response = await api.post(`/booking/mentors/${mentorId}/slots`, data);
    return response.data;
  },

  updateSlot: async (
    mentorId: string,
    slotId: string,
    data: { startAt: string; endAt: string }
  ): Promise<CommonResponse<SlotResponseDto>> => {
    const response = await api.put(`/booking/mentors/${mentorId}/slots/${slotId}`, data);
    return response.data;
  },

  deleteSlot: async (mentorId: string, slotId: string): Promise<CommonResponse<boolean>> => {
    const response = await api.delete(`/booking/mentors/${mentorId}/slots/${slotId}`);
    return response.data;
  },

  // --- Bookings: /api/booking/... ---
  createBooking: async (data: {
    mentorId: string;
    slotId: string;
    topic?: string;
    notes?: string;
    invitedEmails?: string[];
  }): Promise<CommonResponse<BookingResponseDto>> => {
    const hasInvites = (data.invitedEmails?.filter(Boolean) ?? []).length > 0;

    // Match exactly 2 JSON shapes requested:
    // 1) When have invitedEmails: include currency + invitedEmails
    // 2) When no invitedEmails: omit both currency + invitedEmails (backend defaults apply)
    type CreateBookingBody = {
      mentorId: string;
      slotId: string;
      topic?: string;
      notes?: string;
      priceAmount: number;
      currency?: string;
      invitedEmails?: string[];
    };

    const body: CreateBookingBody = {
      mentorId: data.mentorId,
      slotId: data.slotId,
      topic: data.topic,
      notes: data.notes,
      priceAmount: 0,
    };

    if (hasInvites) {
      body.currency = 'VND';
      body.invitedEmails = data.invitedEmails?.filter(Boolean);
    }
    const response = await api.post('/booking/bookings', body);
    return response.data;
  },

  getBookingById: async (bookingId: string): Promise<CommonResponse<BookingResponseDto | null>> => {
    const response = await api.get(`/booking/bookings/${bookingId}`);
    return response.data;
  },

  getMenteeBookings: async (
    menteeId: string,
    pageNumber = 1,
    pageSize = 20
  ): Promise<CommonResponse<PaginationResponse<BookingResponseDto>>> => {
    const response = await api.get(
      `/booking/mentees/${menteeId}/bookings?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    return response.data;
  },

  getMentorBookings: async (
    mentorId: string,
    pageNumber = 1,
    pageSize = 20,
    status?: number
  ): Promise<CommonResponse<PaginationResponse<BookingResponseDto>>> => {
    let url = `/booking/mentors/${mentorId}/bookings?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (status !== undefined) url += `&status=${status}`;
    const response = await api.get(url);
    return response.data;
  },

  acceptBooking: async (bookingId: string): Promise<CommonResponse<BookingResponseDto>> => {
    const response = await api.patch(`/booking/bookings/${bookingId}/accept`);
    return response.data;
  },

  rejectBooking: async (bookingId: string): Promise<CommonResponse<BookingResponseDto>> => {
    const response = await api.patch(`/booking/bookings/${bookingId}/reject`);
    return response.data;
  },

  cancelBooking: async (bookingId: string): Promise<CommonResponse<BookingResponseDto>> => {
    const response = await api.patch(`/booking/bookings/${bookingId}/cancel`);
    return response.data;
  },

  /** Debug Zoom token (AllowAnonymous trên backend) */
  getZoomToken: async (): Promise<{ access_token?: string; error?: string }> => {
    const response = await api.get('/booking/zoom-token');
    return response.data;
  },
};

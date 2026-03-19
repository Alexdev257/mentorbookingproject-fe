import api from './axios';
import type { CommonResponse, SlotResponseDto, BookingResponseDto } from '../types';

export const bookingApi = {
  // Slots
  getMentorSlots: async (mentorId: string): Promise<CommonResponse<SlotResponseDto[]>> => {
    const response = await api.get(`/api/slots/mentor/${mentorId}`);
    return response.data;
  },
  createSlot: async (data: { startAt: string; endAt: string }): Promise<CommonResponse<SlotResponseDto>> => {
    const response = await api.post('/api/slots', data);
    return response.data;
  },
  deleteSlot: async (id: string): Promise<CommonResponse<boolean>> => {
    const response = await api.delete(`/api/slots/${id}`);
    return response.data;
  },

  // Bookings
  createBooking: async (data: any): Promise<CommonResponse<BookingResponseDto>> => {
    const response = await api.post('/api/bookings', data);
    return response.data;
  },
  getMentorBookings: async (): Promise<CommonResponse<BookingResponseDto[]>> => {
    const response = await api.get('/api/bookings/mentor');
    return response.data;
  },
  getMenteeBookings: async (): Promise<CommonResponse<BookingResponseDto[]>> => {
    const response = await api.get('/api/bookings/mentee');
    return response.data;
  },
  acceptBooking: async (id: string): Promise<CommonResponse<boolean>> => {
    const response = await api.post(`/api/bookings/${id}/accept`);
    return response.data;
  },
  rejectBooking: async (id: string, reason: string): Promise<CommonResponse<boolean>> => {
    const response = await api.post(`/api/bookings/${id}/reject`, { reason });
    return response.data;
  },
};

import api from './axios';
import type { CommonResponse, PaginationResponse, MeetingDetailDto, MeetingJoinLinksDto, MeetingListItemDto, MeetingRecordingDto } from '../types';

export const meetingApi = {
  getMeetings: async (
    params?: { pageNumber?: number; pageSize?: number; status?: number }
  ): Promise<CommonResponse<PaginationResponse<MeetingListItemDto>>> => {
    const qs = new URLSearchParams();
    if (params?.pageNumber) qs.set('pageNumber', String(params.pageNumber));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    if (params?.status !== undefined) qs.set('status', String(params.status));
    const q = qs.toString();
    const response = await api.get(`/meeting/meetings${q ? `?${q}` : ''}`);
    return response.data;
  },

  getMeetingById: async (meetingId: string): Promise<CommonResponse<MeetingDetailDto>> => {
    const response = await api.get(`/meeting/meetings/${meetingId}`);
    return response.data;
  },

  getMeetingByBookingId: async (bookingId: string): Promise<CommonResponse<MeetingDetailDto>> => {
    const response = await api.get(`/meeting/by-booking/${bookingId}`);
    return response.data;
  },

  getMeetingJoinLinks: async (meetingId: string): Promise<CommonResponse<MeetingJoinLinksDto>> => {
    const response = await api.get(`/meeting/meetings/${meetingId}/join-links`);
    return response.data;
  },

  getRecordingsByBookingId: async (bookingId: string): Promise<CommonResponse<MeetingRecordingDto[]>> => {
    const response = await api.get(`/meeting/by-booking/${bookingId}/recordings`);
    return response.data;
  },

  getRecordingsByMeetingId: async (meetingId: string): Promise<CommonResponse<MeetingRecordingDto[]>> => {
    const response = await api.get(`/meeting/meetings/${meetingId}/recordings`);
    return response.data;
  },

  getRecordingById: async (recordingId: string): Promise<CommonResponse<MeetingRecordingDto>> => {
    const response = await api.get(`/meeting/recordings/${recordingId}`);
    return response.data;
  },
};

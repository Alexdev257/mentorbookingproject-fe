import api from './axios';
import type { CommonResponse, ReviewResponseDto, PaginationResponse } from '../types';

/** AuthService — /api/reviews/* */

export interface ReviewGetListParams {
  pageNumber?: number;
  pageSize?: number;
  bookingId?: string;
  mentorId?: string;
  menteeId?: string;
  rating?: number;
  sortBy?: string;
  sorting?: boolean;
}

export interface ReviewCreateRequest {
  bookingId: string;
  mentorId: string;
  rating: number;
  comment?: string;
}

export interface ReviewUpdateRequest {
  rating?: number;
  comment?: string;
}

export const reviewApi = {
  getList: async (params?: ReviewGetListParams): Promise<CommonResponse<PaginationResponse<ReviewResponseDto>>> => {
    const qs = new URLSearchParams();
    if (params?.pageNumber) qs.set('pageNumber', String(params.pageNumber));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    if (params?.bookingId) qs.set('bookingId', params.bookingId);
    if (params?.mentorId) qs.set('mentorId', params.mentorId);
    if (params?.menteeId) qs.set('menteeId', params.menteeId);
    if (params?.rating !== undefined) qs.set('rating', String(params.rating));
    if (params?.sortBy) qs.set('sortBy', params.sortBy);
    if (params?.sorting !== undefined) qs.set('sorting', String(params.sorting));
    const q = qs.toString();
    const response = await api.get(`/reviews${q ? `?${q}` : ''}`);
    return response.data;
  },

  getByMentorId: async (mentorId: string): Promise<CommonResponse<ReviewResponseDto[]>> => {
    const response = await api.get(`/reviews/${mentorId}`);
    return response.data;
  },

  create: async (body: ReviewCreateRequest): Promise<CommonResponse<ReviewResponseDto>> => {
    const response = await api.post('/reviews', body);
    return response.data;
  },

  update: async (id: string, body: ReviewUpdateRequest): Promise<CommonResponse<ReviewResponseDto>> => {
    const response = await api.put(`/reviews/${id}`, body);
    return response.data;
  },

  delete: async (id: string): Promise<CommonResponse<boolean>> => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },
};

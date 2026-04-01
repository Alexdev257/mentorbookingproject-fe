import api from './axios';
import type { CommonResponse } from '../types';

/** AIService — /api/transcripts/* */

export interface TranscriptSegmentDto {
  startSeconds?: number;
  endSeconds?: number;
  text?: string;
}

export interface TranscriptUploadResponseDto {
  id: string;
  status: number;
  message?: string;
  segments?: TranscriptSegmentDto[];
  summary?: unknown;
}

export interface TranscriptDetailDto {
  id: string;
  title?: string;
  rawText?: string;
  cleanText?: string;
  status: number;
  segments?: TranscriptSegmentDto[];
  summary?: unknown;
}

export interface TranscriptListItemDto {
  id: string;
  title?: string;
  status: number;
  createdAt?: string;
}

export const transcriptApi = {
  upload: async (file: File, title?: string, sourceType = 1): Promise<CommonResponse<TranscriptUploadResponseDto>> => {
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    form.append('sourceType', String(sourceType));
    const response = await api.post('/transcripts/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  summarize: async (id: string): Promise<CommonResponse<unknown>> => {
    const response = await api.post(`/transcripts/${id}/summarize`);
    return response.data;
  },

  getById: async (id: string): Promise<CommonResponse<TranscriptDetailDto>> => {
    const response = await api.get(`/transcripts/${id}`);
    return response.data;
  },

  /** Backend currently maps GET /transcripts/{id}. FE uses bookingId here by requirement. */
  getByBookingId: async (bookingId: string): Promise<CommonResponse<TranscriptDetailDto>> => {
    const response = await api.get(`/transcripts/${bookingId}`);
    return response.data;
  },

  getList: async (pageNumber = 1, pageSize = 20): Promise<CommonResponse<TranscriptListItemDto[]>> => {
    const response = await api.get(`/transcripts?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  },
};

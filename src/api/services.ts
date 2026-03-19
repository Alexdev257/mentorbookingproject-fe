import api from './axios';
import type { TokenDTO, CommonResponse, TeacherResponseDto, StudentResponseDto } from '../types';

export const authApi = {
  login: async (request: any): Promise<CommonResponse<TokenDTO>> => {
    const response = await api.post('/api/auth/login', request);
    return response.data;
  },
  logout: async (): Promise<CommonResponse<any>> => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
  refresh: async (refreshToken: string): Promise<CommonResponse<TokenDTO>> => {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};

export const adminApi = {
  getAllTeachers: async (pageNumber = 1, pageSize = 10): Promise<CommonResponse<any>> => {
    const response = await api.get(`/api/admin/teachers?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  },
  getTeacherById: async (id: string): Promise<CommonResponse<TeacherResponseDto>> => {
    const response = await api.get(`/api/admin/teachers/${id}`);
    return response.data;
  },
  createTeacher: async (data: FormData): Promise<CommonResponse<TeacherResponseDto>> => {
    const response = await api.post('/api/admin/teachers', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  updateTeacher: async (id: string, data: FormData): Promise<CommonResponse<TeacherResponseDto>> => {
    const response = await api.put(`/api/admin/teachers/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteTeacher: async (id: string): Promise<CommonResponse<boolean>> => {
    const response = await api.delete(`/api/admin/teachers/${id}`);
    return response.data;
  },
  getAllStudents: async (pageNumber = 1, pageSize = 10): Promise<CommonResponse<any>> => {
    const response = await api.get(`/api/admin/students?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  },
  getStudentById: async (id: string): Promise<CommonResponse<StudentResponseDto>> => {
    const response = await api.get(`/api/admin/students/${id}`);
    return response.data;
  },
  createStudent: async (data: FormData): Promise<CommonResponse<StudentResponseDto>> => {
    const response = await api.post('/api/admin/students', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  updateStudent: async (id: string, data: FormData): Promise<CommonResponse<StudentResponseDto>> => {
    const response = await api.put(`/api/admin/students/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteStudent: async (id: string): Promise<CommonResponse<boolean>> => {
    const response = await api.delete(`/api/admin/students/${id}`);
    return response.data;
  },
};

export const userApi = {
  getAllMentors: async (pageNumber = 1, pageSize = 10): Promise<CommonResponse<any>> => {
    const response = await api.get(`/api/users/mentors?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  },
  getUserById: async (id: string): Promise<CommonResponse<any>> => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },
};

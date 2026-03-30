import api from './axios';
import type { TokenDTO, CommonResponse, TeacherResponseDto, StudentResponseDto } from '../types';

/** Auth — routes: /api/auth/* → base đã có /api nên path = /auth/... */
export const authApi = {
  login: async (request: { email: string; password: string }): Promise<CommonResponse<TokenDTO>> => {
    const response = await api.post('/auth/login', request);
    return response.data;
  },
  logout: async (): Promise<CommonResponse<unknown>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  refresh: async (accessToken: string, refreshToken: string): Promise<CommonResponse<TokenDTO>> => {
    const response = await api.post('/auth/refresh', { accessToken, refreshToken });
    return response.data;
  },
};

/** Admin — /api/admin/* */
export const adminApi = {
  registerTeacher: async (data: FormData): Promise<CommonResponse<TeacherResponseDto>> => {
    const response = await api.post('/admin/register-teacher', data);
    return response.data;
  },
  registerStudent: async (data: FormData): Promise<CommonResponse<StudentResponseDto>> => {
    const response = await api.post('/admin/register-student', data);
    return response.data;
  },
  getAllTeachers: async (pageNumber = 1, pageSize = 10) => {
    const response = await api.get(`/admin/teachers?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  },
  getTeacherById: async (id: string): Promise<CommonResponse<TeacherResponseDto>> => {
    const response = await api.get(`/admin/teachers/${id}`);
    return response.data;
  },
  updateTeacher: async (id: string, data: FormData): Promise<CommonResponse<TeacherResponseDto>> => {
    const response = await api.put(`/admin/teachers/${id}`, data);
    return response.data;
  },
  updateTeacherStatus: async (id: string, body: { isActive: boolean }): Promise<CommonResponse<TeacherResponseDto>> => {
    const response = await api.patch(`/admin/teachers/${id}/status`, body);
    return response.data;
  },
  deleteTeacher: async (id: string): Promise<CommonResponse<boolean>> => {
    const response = await api.delete(`/admin/teachers/${id}`);
    return response.data;
  },
  getAllStudents: async (pageNumber = 1, pageSize = 10) => {
    const response = await api.get(`/admin/students?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  },
  getStudentById: async (id: string): Promise<CommonResponse<StudentResponseDto>> => {
    const response = await api.get(`/admin/students/${id}`);
    return response.data;
  },
  updateStudent: async (id: string, data: FormData): Promise<CommonResponse<StudentResponseDto>> => {
    const response = await api.put(`/admin/students/${id}`, data);
    return response.data;
  },
  updateStudentStatus: async (id: string, body: { isActive: boolean }): Promise<CommonResponse<StudentResponseDto>> => {
    const response = await api.patch(`/admin/students/${id}/status`, body);
    return response.data;
  },
  deleteStudent: async (id: string): Promise<CommonResponse<boolean>> => {
    const response = await api.delete(`/admin/students/${id}`);
    return response.data;
  },
};

/** Users — nội bộ / lookup theo id */
export const userApi = {
  getUserById: async (id: string): Promise<CommonResponse<{ email: string; fullName: string }>> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
};

/** Danh sách mentor công khai (AuthService MentorDirectoryController) */
export const mentorsApi = {
  list: async (pageNumber = 1, pageSize = 50) => {
    const response = await api.get(`/mentors?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  },
  getById: async (id: string): Promise<CommonResponse<TeacherResponseDto | null>> => {
    const response = await api.get(`/mentors/${id}`);
    return response.data;
  },
};

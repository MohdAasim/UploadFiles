import axios from 'axios';
import type { 
  AuthResponse, 
  ApiResponse, 
  FileType, 
  FolderType, 
  SearchFilters,
  User,
  OnlineUser
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password }),
  
  getCurrentUser: () =>
    api.get<ApiResponse<User>>('/auth/me'),
};

// Files API
export const filesAPI = {
  uploadFile: (formData: FormData) =>
    api.post<ApiResponse<FileType>>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getFiles: (parentFolder?: string) =>
    api.get<ApiResponse<FileType[]>>('/files', {
      params: { parentFolder },
    }),
  
  previewFile: (fileId: string) =>
    api.get(`/files/preview/${fileId}`, {
      responseType: 'blob',
    }),
  
  deleteFile: (fileId: string) =>
    api.delete<ApiResponse>(`/files/${fileId}`),
  
  updateFile: (fileId: string, data: { originalName: string }) =>
    api.put<ApiResponse<FileType>>(`/files/${fileId}`, data),
};

// Folders API
export const foldersAPI = {
  createFolder: (name: string, parent?: string) =>
    api.post<ApiResponse<FolderType>>('/folders/create', { name, parent }),
  
  getFolderTree: () =>
    api.get<ApiResponse<FolderType[]>>('/folders/tree'),
  
  deleteFolder: (folderId: string) =>
    api.delete<ApiResponse>(`/folders/${folderId}`),
  
  updateFolder: (folderId: string, data: { name: string }) =>
    api.put<ApiResponse<FolderType>>(`/folders/${folderId}`, data),
};

// Search API
export const searchAPI = {
  search: (filters: SearchFilters) =>
    api.get<ApiResponse>('/search', { params: filters }),
};

// Share API
export const shareAPI = {
  shareResource: (data: {
    resourceId: string;
    resourceType: 'file' | 'folder';
    targetEmail: string;
    permission: 'view' | 'edit' | 'admin';
  }) =>
    api.post<ApiResponse>('/share', data),
  
  getSharedWithMe: () =>
    api.get<ApiResponse>('/share/shared-with-me'),
  
  getFilePermissions: (fileId: string) =>
    api.get<ApiResponse>(`/share/file/${fileId}/permissions`),
  
  getFolderPermissions: (folderId: string) =>
    api.get<ApiResponse>(`/share/folder/${folderId}/permissions`),
};

// Versions API
export const versionsAPI = {
  uploadNewVersion: (fileId: string, formData: FormData) =>
    api.post<ApiResponse>(`/versions/upload/${fileId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getVersionHistory: (fileId: string) =>
    api.get<ApiResponse>(`/versions/history/${fileId}`),
  
  restoreVersion: (fileId: string, versionNumber: number) =>
    api.post<ApiResponse>(`/versions/restore/${fileId}`, { versionNumber }),
};

// Bulk API
export const bulkAPI = {
  bulkAction: (data: {
    action: 'delete' | 'move' | 'download';
    files?: string[];
    folders?: string[];
    targetFolder?: string;
  }) =>
    api.post<ApiResponse>('/bulk', data),
};

// Real-time API
export const realtimeAPI = {
  getOnlineUsers: () =>
    api.get<ApiResponse<OnlineUser[]>>('/realtime/online-users'),
  
  getFileEditingStatus: (fileId: string) =>
    api.get<ApiResponse>(`/realtime/file-status/${fileId}`),
  
  sendNotification: (data: {
    targetUserId: string;
    type: string;
    message: string;
    resourceId?: string;
  }) =>
    api.post<ApiResponse>('/realtime/notify', data),
};
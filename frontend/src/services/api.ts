import axios from 'axios';
import type {
  AuthResponse,
  ApiResponse,
  FileType,
  FolderType,
  User,
  OnlineUser,
  BulkActionData,
  BulkDeleteResponse,
  BulkDeleteData,
} from "../types";
import type { MySharedResource, SharedResource, SharePermission } from '../types/sharing';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }),

  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>("/auth/register", { name, email, password }),

  getCurrentUser: () => api.get<ApiResponse<User>>("/auth/me"),
};

// Files API
export const filesAPI = {
  uploadFile: (formData: FormData) =>
    api.post<ApiResponse<FileType>>("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getFiles: (parentFolder?: string) =>
    api.get<ApiResponse<FileType[]>>("/files", {
      params: { parentFolder },
    }),

  previewFile: (fileId: string) =>
    api.get(`/files/preview/${fileId}`, {
      responseType: "blob",
    }),

  deleteFile: (fileId: string) => api.delete<ApiResponse>(`/files/${fileId}`),

  updateFile: (fileId: string, data: { originalName: string }) =>
    api.put<ApiResponse<FileType>>(`/files/${fileId}`, data),
};

// Folders API
export const foldersAPI = {
  createFolder: (
    name: string,
    parent?: string,
    options?: {
      description?: string;
      tags?: string[];
      isTemplate?: boolean;
    }
  ) => {
    const data = {
      name,
      parent,
      ...options,
    };
    return api.post<ApiResponse<FolderType>>("/folders/create", data);
  },

  // Get folder tree (files + folders in current directory)
  getFolderTree: (parentFolder?: string) =>
    api.get<
      ApiResponse<{
        folders: FolderType[];
        files: FileType[];
        folderCount: number;
        fileCount: number;
        currentFolder: string | null;
      }>
    >("/folders/tree", {
      params: { parent: parentFolder },
    }),

  // Get all folders (for navigation/stats)
  getAllFolders: () =>
    api.get<ApiResponse<{ folders: FolderType[]; count: number }>>(
      "/folders/all"
    ),

  // Delete folder
  deleteFolder: (folderId: string) =>
    api.delete<ApiResponse>(`/folders/${folderId}`),

  // Update folder (rename)
  updateFolder: (folderId: string, data: { name: string }) =>
    api.put<ApiResponse<FolderType>>(`/folders/${folderId}`, data),
};

// Search API - simplified version
export const searchAPI = {
  // Basic search using existing backend route
  search: (params: {
    q?: string;
    type?: string;
    inFolder?: string;
    kind?: "file" | "folder" | "all";
  }) => {
    console.log('API: Making search request with params:', params);
    return api.get<
      ApiResponse<{
        files: FileType[];
        folders: FolderType[];
        summary: {
          totalFiles: number;
          totalFolders: number;
          searchQuery: string;
          searchType: string;
          searchKind: string;
        };
      }>
    >("/search", { params });
  },
};

// Share API
export const shareAPI = {
  shareResource: (data: {
    resourceId: string;
    resourceType: 'file' | 'folder';
    targetUserEmail: string;
    permission: 'view' | 'edit' | 'admin';
  }) =>
    api.post<ApiResponse<{
      sharedWith: {
        user: { id: string; name: string; email: string };
        permission: string;
        resourceType: string;
      };
    }>>('/share', data),
  
  getSharedWithMe: () =>
    api.get<{
      sharedWithMe: {
        files: SharedResource[];
        folders: SharedResource[];
      };
    }>('/share/shared-with-me'),
  
  getMySharedResources: () =>
    api.get<{
      mySharedResources: {
        files: MySharedResource[];
        folders: MySharedResource[];
      };
    }>('/share/my-shared'),
  
  getFilePermissions: (fileId: string) =>
    api.get<ApiResponse<{
      file: { id: string; name: string; owner: string };
      permissions: SharePermission[];
    }>>(`/share/file/${fileId}/permissions`),
  
  getFolderPermissions: (folderId: string) =>
    api.get<ApiResponse<{
      folder: { id: string; name: string; owner: string };
      permissions: SharePermission[];
    }>>(`/share/folder/${folderId}/permissions`),
  
  removePermission: (data: {
    resourceId: string;
    resourceType: 'file' | 'folder';
    targetUserEmail: string;
  }) =>
    api.delete<ApiResponse>('/share/permission', { data }),
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
  bulkAction: (data: BulkActionData) =>
    api.post<ApiResponse<BulkDeleteResponse>>('/api/v1/bulk', data),
  
  bulkDelete: (data: BulkDeleteData) =>
    api.post<ApiResponse<BulkDeleteResponse>>('/api/v1/bulk', {
      action: 'delete',
      ...data,
    }),
  
  bulkMove: (data: { files: string[]; folders: string[]; targetFolder: string }) =>
    api.post<ApiResponse<BulkDeleteResponse>>('/api/v1/bulk', {
      action: 'move',
      ...data,
    }),
  
  bulkDownload: (data: { files: string[]; folders: string[] }) =>
    api.post<ApiResponse<{ files: Array<{ id: string; name: string; downloadUrl: string; size: number; mimetype: string }>; folders: string[] }>>('/api/v1/bulk', {
      action: 'download',
      ...data,
    }),
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
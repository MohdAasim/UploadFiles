export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
}

export interface FileType {
  _id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedBy: User;
  parentFolder?: string | null;
  sharedWith: SharedEntry[];
  versions: FileVersion[];
  createdAt: string;
  updatedAt: string; // Add this if missing
}

export interface FileVersion {
  versionNumber: number;
  filename: string;
  path: string;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  remark?: string;
}

export interface VersionHistoryData {
  file: {
    id: string;
    originalName: string;
    currentVersion: number;
  };
  versions: FileVersion[];
}

export interface FolderType {
  _id: string;
  name: string;
  parent?: string | null;
  owner: User;
  path: string;
  sharedWith: SharedEntry[];
  createdAt: string;
  updatedAt: string; // Add this if missing
}

export interface SharedEntry {
  user: User;
  permission: 'view' | 'edit' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// Fixed ApiResponse to remove 'any' types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  results?: T;
  error?: string;
  errors?: Record<string, string>;
}

export interface SearchFilters {
  fileType?: string;
  dateFrom?: string;
  dateTo?: string;
  minSize?: string | number;
  maxSize?: string | number;
  tags?: string;
  owner?: string;
  searchContent?: boolean;
  sortBy?: string;
}

export interface NotificationData {
  type: string;
  message: string;
  from: User;
  resourceId?: string;
  timestamp: string;
}

export interface searchResultsType {
  data?: {
    files: FileType[];
    folders: FolderType[];
    summary?: {
      totalFiles: number;
      totalFolders: number;
      searchQuery: string;
      searchType: string;
      searchKind: string;
      filteredCount?: number;
      matchesInContent?: number;
    };
  };
}

// Additional types for better API responses
export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export interface FileEditingSession {
  userId: string;
  userName: string;
  timestamp: Date;
}

// Fixed CollaborationEvent to remove 'any' type
export interface CursorPosition {
  x: number;
  y: number;
  line?: number;
  column?: number;
}

export interface CollaborationEvent {
  type: 'user-joined' | 'user-left' | 'cursor-moved';
  user: User;
  resourceId: string;
  position?: CursorPosition;
}

// Additional utility types for better type safety
export interface BulkActionData {
  action: 'delete' | 'move' | 'download';
  files?: string[];
  folders?: string[];
  targetFolder?: string;
}

export interface BulkDeleteData {
  files: string[];
  folders: string[];
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedFiles: number;
  deletedFolders: number;
}

export interface BulkDownloadData {
  files: string[];
  folders: string[];
}

export interface FileDownloadInfo {
  id: string;
  name: string;
  downloadUrl: string;
  size: number;
  mimetype: string;
}

export interface BulkDownloadResponse {
  success: boolean;
  data: {
    files: FileDownloadInfo[];
    folders: string[];
  };
}

export interface ShareResourceData {
  resourceId: string;
  resourceType: 'file' | 'folder';
  targetEmail: string;
  permission: 'view' | 'edit' | 'admin';
}

export interface FilePermission {
  user: User;
  permission: 'view' | 'edit' | 'admin';
  grantedBy: User;
  grantedAt: string;
}

export interface FolderPermission {
  user: User;
  permission: 'view' | 'edit' | 'admin';
  grantedBy: User;
  grantedAt: string;
}

// Search result types
export interface SearchResults {
  files?: FileType[];
  folders?: FolderType[];
  summary?: SearchSummary;
}

export interface SearchSummary {
  totalFiles: number;
  totalFolders: number;
  searchQuery: string;
  searchType: string;
  searchKind: string;
}

// Error handling types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateFolderFormData {
  name: string;
  parent?: string;
}

export interface RenameFormData {
  name: string;
}

// Real-time event types
export interface FileUploadedEvent {
  file: FileType;
  uploadedBy: User;
  parentFolder?: string;
}

export interface UserEditingEvent {
  fileId: string;
  userId: string;
  userName: string;
}

export interface ResourceSharedEvent {
  resourceId: string;
  resourceType: 'file' | 'folder';
  permission: string;
  sharedBy: User;
}

export interface PermissionUpdatedEvent {
  resourceId: string;
  newPermission: string;
  updatedBy: User;
}

// File upload types
export interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedFile?: FileType;
}

// Navigation types
export interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

// Theme and UI types
export interface ThemeMode {
  mode: 'light' | 'dark';
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  persistent?: boolean;
}

export interface SelectableItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  parentFolder?: string;
}

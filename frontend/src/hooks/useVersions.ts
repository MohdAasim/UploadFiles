import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { versionsAPI } from '../services/api';
import toast from 'react-hot-toast';

// Hook to get version history
export const useVersionHistory = (fileId: string) => {
  return useQuery({
    queryKey: ['version-history', fileId],
    queryFn: () => versionsAPI.getVersionHistory(fileId),
    enabled: !!fileId,
    select: (data) => {
      const responseData = data?.data?.data || data?.data || data;      
      return responseData || {
        file: { id: fileId, originalName: 'Unknown', currentVersion: 1 },
        versions: []
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

// Hook to upload new version
export const useUploadNewVersion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      fileId: string;
      file: File;
      remark?: string;
      onProgress?: (progress: number) => void;
    }) => {
      const { fileId, file, remark, onProgress } = data;
      
      const formData = new FormData();
      formData.append('file', file);
      if (remark) {
        formData.append('remark', remark);
      }

      // Handle progress if provided
      if (onProgress) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch  {
                reject(new Error('Invalid response format'));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          const token = localStorage.getItem('token');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
          
          xhr.open('POST', `${API_BASE_URL}/versions/upload/${fileId}`);
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          xhr.send(formData);
        });
      } else {
        return versionsAPI.uploadNewVersion(fileId, formData);
      }
    },
    onSuccess: (_, variables) => {
      toast.success('New version uploaded successfully!');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['version-history', variables.fileId] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folderTree'] });
    },
    onError: (error) => {
      console.error('Upload version error:', error);
      toast.error(`Failed to upload new version: ${error?.message || 'Unknown error'}`);
    },
  });
};

// Hook to restore version
export const useRestoreVersion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      fileId: string;
      versionNumber: number;
    }) => versionsAPI.restoreVersion(data.fileId, data.versionNumber),
    onSuccess: (_, variables) => {
      toast.success(`Version ${variables.versionNumber} restored successfully!`);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['version-history', variables.fileId] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folderTree'] });
    },
    onError: (error) => {
      console.error('Restore version error:', error);
      toast.error(`Failed to restore version: ${error?.message || 'Unknown error'}`);
    },
  });
};
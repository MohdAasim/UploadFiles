import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shareAPI } from '../services/api';
import toast from 'react-hot-toast';
import type { ShareResourceRequest} from '../types/sharing';

// Hook to share a resource
export const useShareResource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ShareResourceRequest) => shareAPI.shareResource(data),
    onSuccess: (_, variables) => {
      toast.success(`${variables.resourceType === 'file' ? 'File' : 'Folder'} shared successfully!`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['my-shared-resources'] });
      queryClient.invalidateQueries({ queryKey: ['file-permissions', variables.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['folder-permissions', variables.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['shared-with-me'] });
    },
    onError: (error) => {
      console.error('Share resource error:', error);
      toast.error(`Failed to share`);
    },
  });
};

// Hook to get resources shared with me
export const useSharedWithMe = () => {
  return useQuery({
    queryKey: ['shared-with-me'],
    queryFn: async () => {
      try {
        const response = await shareAPI.getSharedWithMe();
        console.log('Shared with me response:', response);
        
        // Access the data correctly: response.data.data.sharedWithMe
        return response.data?.sharedWithMe || {
          files: [],
          folders: [],
        };
      } catch (error) {
        console.error('Error fetching shared with me:', error);
        // Return default structure on error to prevent undefined
        return {
          files: [],
          folders: []
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
  });
};

// Hook to get my shared resources
export const useMySharedResources = () => {
  return useQuery({
    queryKey: ['my-shared-resources'],
    queryFn: async () => {
      try {
        const response = await shareAPI.getMySharedResources();
        console.log('My shared resources response:', response);
        
        // Access the data correctly: response.data.data.mySharedResources
        return response.data?.mySharedResources || {
          files: [],
          folders: [],
        };
      } catch (error) {
        console.error('Error fetching my shared resources:', error);
        // Return default structure on error to prevent undefined
        return {
          files: [],
          folders: []
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
  });
};

// Hook to get file permissions
export const useFilePermissions = (fileId: string) => {
  return useQuery({
    queryKey: ['file-permissions', fileId],
    queryFn: async () => {
      try {
        console.log('Fetching file permissions for:', fileId);
        const response = await shareAPI.getFilePermissions(fileId);
        console.log('File permissions response:', response);
        
        // Return a default structure if response is empty or invalid
        return response.data?.data || {
          file: {
            id: fileId,
            name: 'Unknown File',
            owner: 'Unknown'
          },
          permissions: []
        };
      } catch (error) {
        console.error('Error fetching file permissions:', error);
        // Return default structure on error to prevent undefined
        return {
          file: {
            id: fileId,
            name: 'Unknown File',
            owner: 'Unknown'
          },
          permissions: []
        };
      }
    },
    enabled: !!fileId && fileId.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1, // Only retry once
  });
};

// Hook to get folder permissions
export const useFolderPermissions = (folderId: string) => {
  return useQuery({
    queryKey: ['folder-permissions', folderId],
    queryFn: async () => {
      try {
        console.log('Fetching folder permissions for:', folderId);
        const response = await shareAPI.getFolderPermissions(folderId);
        console.log('Folder permissions response:', response);
        
        // Return a default structure if response is empty or invalid
        return response.data?.data || {
          folder: {
            id: folderId,
            name: 'Unknown Folder',
            owner: 'Unknown'
          },
          permissions: []
        };
      } catch (error) {
        console.error('Error fetching folder permissions:', error);
        // Return default structure on error to prevent undefined
        return {
          folder: {
            id: folderId,
            name: 'Unknown Folder',
            owner: 'Unknown'
          },
          permissions: []
        };
      }
    },
    enabled: !!folderId && folderId.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1, // Only retry once
  });
};

// Hook to remove permission
export const useRemovePermission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      resourceId: string;
      resourceType: 'file' | 'folder';
      targetUserEmail: string;
    }) => shareAPI.removePermission(data),
    onSuccess: (_, variables) => {
      toast.success('Permission removed successfully!');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['my-shared-resources'] });
      queryClient.invalidateQueries({ queryKey: ['file-permissions', variables.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['folder-permissions', variables.resourceId] });
      queryClient.invalidateQueries({ queryKey: ['shared-with-me'] });
    },
    onError: (error) => {
      console.error('Remove permission error:', error);
      toast.error(`Failed to remove permission`);
    },
  });
};
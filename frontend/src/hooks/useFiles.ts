import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI, foldersAPI } from '../services/api';
// import type { FileType, FolderType } from '../types';
import toast from 'react-hot-toast';

export const useFiles = (parentFolder?: string) => {
  return useQuery({
    queryKey: ['files', parentFolder],
    queryFn: () => filesAPI.getFiles(parentFolder),
    select: (data) => data.data.data || [],
  });
};

export const useFolders = () => {
  return useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersAPI.getFolderTree(),
    select: (data) => data.data.data || [],
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (formData: FormData) => filesAPI.uploadFile(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File uploaded successfully!');
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (fileId: string) => filesAPI.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ name, parent }: { name: string; parent?: string }) => 
      foldersAPI.createFolder(name, parent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('Folder created successfully!');
    },
    onError: (error) => {
      toast.error(`Create folder failed: ${error.message}`);
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (folderId: string) => foldersAPI.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('Folder deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Delete folder failed: ${error.message}`);
    },
  });
};
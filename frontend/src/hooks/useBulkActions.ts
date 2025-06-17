import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkAPI } from '../services/api';
import toast from 'react-hot-toast';
import type { BulkDeleteData, BulkDownloadData } from '../types';

export const useBulkActions = () => {
  const queryClient = useQueryClient();

  const bulkDelete = useMutation({
    mutationFn: (data: BulkDeleteData) => bulkAPI.bulkDelete(data),
    onSuccess: (response) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folderTree'] });
      
      toast.success(response.data.message || 'Items deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Bulk delete error:', error);
      toast.error(`Failed to delete items: ${error.message || 'Unknown error'}`);
    },
  });

  const bulkDownload = useMutation({
    mutationFn: (data: BulkDownloadData) => bulkAPI.bulkDownload(data),
    onSuccess: () => {
      toast.success('Download prepared successfully');
    },
    onError: (error: Error) => {
      toast.error(`Bulk download failed: ${error?.message || 'Unknown error'}`);
    },
  });

  const bulkMove = useMutation({
    mutationFn: (data: { files: string[]; folders: string[]; targetFolder: string }) => 
      bulkAPI.bulkMove(data),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folderTree'] });
      
      toast.success('Items moved successfully');
    },
    onError: (error: Error) => {
      console.error('Bulk action error:', error);
      toast.error(`Action failed: ${error.message || 'Unknown error'}`);
    },
  });

  return {
    bulkDelete,
    bulkDownload,
    bulkMove,
  };
};
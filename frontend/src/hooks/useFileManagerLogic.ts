// /home/arslaanas/Desktop/UploadFiles/frontend/src/hooks/useFileManagerLogic.ts
import { useState, useMemo } from 'react';
import { api } from '../services/api';
import {
  showDeleteConfirmation,
  showSuccessAlert,
  showErrorAlert,
} from '../utils/sweetAlert';
import type { FileType, FolderType, SelectableItem } from '../types';

export interface FileWithType extends FileType {
  type: 'file';
}
export interface FolderWithType extends FolderType {
  type: 'folder';
}
export type ItemWithType = FileWithType | FolderWithType;
/*eslint-disable @typescript-eslint/no-explicit-any*/
export function useFileManagerLogic(
  allItems: ItemWithType[],
  onFolderClick: (folderId?: string) => void,
  deleteFile: any,
  deleteFolder: any
) {
  // Selection
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const selectionMode = selectedItems.length > 0;

  // Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<ItemWithType | null>(null);

  // Dialogs
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareResource, setShareResource] = useState<{
    id: string;
    type: 'file' | 'folder';
    name: string;
  } | null>(null);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [selectedFileForVersion, setSelectedFileForVersion] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDownloadDialogOpen, setBulkDownloadDialogOpen] = useState(false);
  const [bulkMoveDialogOpen, setBulkMoveDialogOpen] = useState(false);

  // Selection logic
  const isAllSelected =
    selectedItems.length === allItems.length && allItems.length > 0;
  const isIndeterminate =
    selectedItems.length > 0 && selectedItems.length < allItems.length;

  const handleItemSelect = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allItems.map((item) => item._id));
    }
  };

  const handleClearSelection = () => setSelectedItems([]);

  const selectedSelectableItems: SelectableItem[] = useMemo(() => {
    return selectedItems
      .map((itemId) => {
        const item = allItems.find((item) => item._id === itemId);
        if (!item) return null;
        return {
          id: item._id,
          name: item.type === 'file' ? item.originalName : item.name,
          type: item.type,
          size: item.type === 'file' ? item.size : undefined,
          parentFolder: item.type === 'file' ? item.parentFolder : item.parent,
        };
      })
      .filter(Boolean) as SelectableItem[];
  }, [selectedItems, allItems]);

  // Bulk actions
  const handleBulkDelete = () => setBulkDeleteDialogOpen(true);
  const handleBulkDownload = () => setBulkDownloadDialogOpen(true);
  const handleBulkMove = () => setBulkMoveDialogOpen(true);
  const handleBulkDeleteComplete = () => setSelectedItems([]);
  const handleBulkDownloadComplete = () => setSelectedItems([]);
  const handleBulkMoveComplete = () => setSelectedItems([]);

  // Menu actions
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    item: ItemWithType
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const itemName =
      selectedItem.type === 'file'
        ? (selectedItem as FileWithType).originalName
        : (selectedItem as FolderWithType).name;
    const itemType = selectedItem.type === 'file' ? 'file' : 'folder';
    try {
      const confirmed = await showDeleteConfirmation(
        `Delete ${itemType}?`,
        `Are you sure you want to delete "${itemName}"?${
          selectedItem.type === 'folder'
            ? ' This will also delete all contents of the folder.'
            : ''
        }`,
        `Yes, delete ${itemType}!`
      );
      if (confirmed) {
        if (selectedItem.type === 'file') {
          await deleteFile.mutateAsync(selectedItem._id);
        } else {
          await deleteFolder.mutateAsync(selectedItem._id);
        }
        await showSuccessAlert(
          'Deleted!',
          `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} has been deleted.`
        );
      }
    } catch (error) {
      await showErrorAlert(
        'Delete Failed',
        (error as Error).message || `Failed to delete ${itemType}`
      );
    }
    handleMenuClose();
  };

  const handlePreview = async (file: FileWithType) => {
    setSelectedFileForPreview({
      id: file._id,
      name: file.originalName,
      type: file.mimetype,
    });
    setPreviewDialogOpen(true);
  };

  const handleClosePreview = () => {
    setSelectedFileForPreview(null);
    setPreviewDialogOpen(false);
  };

  const handleDownload = async (file: FileWithType) => {
    try {
      const response = await api.get(`/files/preview/${file._id}`, {
        responseType: 'blob',
      });
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      await showErrorAlert(
        'Download Failed',
        error?.message || 'Failed to download file'
      );
    }
  };

  const handleFolderDoubleClick = (folder: FolderWithType) => {
    if (selectedItems.length === 0) {
      onFolderClick(folder._id);
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype.startsWith('video/')) return '🎥';
    if (mimetype.startsWith('audio/')) return '🎵';
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet'))
      return '📊';
    if (mimetype.includes('zip') || mimetype.includes('archive')) return '📦';
    return '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleShare = (item: ItemWithType) => {
    setShareResource({
      id: item._id,
      type: item.type,
      name:
        item.type === 'file'
          ? (item as FileWithType).originalName
          : (item as FolderWithType).name,
    });
    setShareDialogOpen(true);
    handleMenuClose();
  };

  const handleVersionHistory = (file: FileWithType) => {
    setSelectedFileForVersion({
      id: file._id,
      name: file.originalName,
    });
    setVersionDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseVersionDialog = () => {
    setSelectedFileForVersion(null);
    setVersionDialogOpen(false);
  };

  return {
    // Selection
    selectedItems,
    setSelectedItems,
    selectionMode,
    isAllSelected,
    isIndeterminate,
    handleItemSelect,
    handleSelectAll,
    handleClearSelection,
    selectedSelectableItems,

    // Bulk
    handleBulkDelete,
    handleBulkDownload,
    handleBulkMove,
    handleBulkDeleteComplete,
    handleBulkDownloadComplete,
    handleBulkMoveComplete,

    // Menu
    anchorEl,
    selectedItem,
    handleMenuOpen,
    handleMenuClose,
    handleDelete,

    // Dialogs
    previewDialogOpen,
    selectedFileForPreview,
    handlePreview,
    handleClosePreview,
    shareDialogOpen,
    shareResource,
    setShareDialogOpen,
    setShareResource,
    versionDialogOpen,
    selectedFileForVersion,
    handleVersionHistory,
    handleCloseVersionDialog,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    bulkDownloadDialogOpen,
    setBulkDownloadDialogOpen,
    bulkMoveDialogOpen,
    setBulkMoveDialogOpen,

    // File/folder
    handleDownload,
    handleFolderDoubleClick,
    getFileIcon,
    formatFileSize,
    handleShare,
  };
}

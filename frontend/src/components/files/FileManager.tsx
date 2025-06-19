/*eslint-disable */
import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Checkbox,
  Toolbar,
  Button,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert,
  CloudUpload,
  Folder,
  Delete,
  Share,
  Download,
  Visibility,
  History,
  SelectAll,
  Clear,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import {
  useFolderTree,
  useDeleteFile,
  useDeleteFolder,
} from '../../hooks/useFiles';
import {
  showDeleteConfirmation,
  showSuccessAlert,
  showErrorAlert,
} from '../../utils/sweetAlert';
import type { FileType, FolderType, SelectableItem } from '../../types';
import { api } from '../../services/api';
import FileViewersIndicator from './FileViewersIndicator';
import { useViewing } from '../../contexts/ViewingContext';
import ShareDialog from '../dialogs/ShareDialog';
import PreviewDialog from '../dialogs/PreviewDialog';
import VersionHistoryDialog from '../dialogs/VersionHistoryDialog';
import BulkDeleteDialog from '../dialogs/BulkDeleteDialog';
import BulkDownloadDialog from '../dialogs/BulkDownloadDialog';
import { ErrorLoading_Const, Loading_Const } from '../../utils/constant';

interface FileManagerProps {
  currentFolder?: string;
  onFolderClick: (folderId?: string) => void;
  searchResults?: {
    data: {
      files: FileType[];
      folders: FolderType[];
    };
  } | null;
}

// Create extended types with the type property
interface FileWithType extends FileType {
  type: 'file';
}

interface FolderWithType extends FolderType {
  type: 'folder';
}

type ItemWithType = FileWithType | FolderWithType;

const FileManager: React.FC<FileManagerProps> = ({
  currentFolder,
  onFolderClick,
  searchResults = null,
}) => {
  // ALL HOOKS MUST BE AT THE TOP - MOVE EVERYTHING HERE
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<ItemWithType | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const selectionMode = selectedItems.length > 0;
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

  const { startViewing } = useViewing();

  // Use the new hook that gets both files and folders for current folder
  const {
    data: folderTree,
    isLoading: treeLoading,
    error: treeError,
  } = useFolderTree(currentFolder);

  const deleteFile = useDeleteFile();
  const deleteFolder = useDeleteFolder();

  // Decide which data to use - search results or regular folder tree
  const displayData = searchResults?.data || folderTree;
  const isLoading = searchResults?.data ? false : treeLoading;
  const error = searchResults ? null : treeError;

  // Extract files and folders from display data
  const files = displayData?.files || [];
  const folders = displayData?.folders || [];

  // Create combined items array
  const allItems: ItemWithType[] = useMemo(
    () => [
      ...folders.map((folder: FolderType) => ({
        ...folder,
        type: 'folder' as const,
      })),
      ...files.map((file: FileType) => ({ ...file, type: 'file' as const })),
    ],
    [files, folders]
  );

  // Convert selected items to SelectableItem format for bulk dialogs
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

  // Add viewing handlers
  const handleFileClick = (id: string) => {
    startViewing(id);
  };

  console.log('FileManager: Display data:', {
    files: files.length,
    folders: folders.length,
    isSearchResults: !!searchResults,
  });

  // CONDITIONAL LOGIC AFTER ALL HOOKS
  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>{Loading_Const}</Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    console.error('Folder tree error:', error);
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{ErrorLoading_Const}</Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
      </Box>
    );
  }

  // Selection handlers
  const handleItemSelect = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === allItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allItems.map((item) => item._id));
    }
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDownload = () => {
    setBulkDownloadDialogOpen(true);
  };

  const handleBulkDeleteComplete = () => {
    setSelectedItems([]);
  };

  const handleBulkDownloadComplete = () => {
    setSelectedItems([]);
  };

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
          `${
            itemType.charAt(0).toUpperCase() + itemType.slice(1)
          } has been deleted.`
        );
      }
    } catch (error: any) {
      await showErrorAlert(
        'Delete Failed',
        error?.message || `Failed to delete ${itemType}`
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
    if (mimetype.startsWith('image/')) {
      return '🖼️';
    } else if (mimetype.startsWith('video/')) {
      return '🎥';
    } else if (mimetype.startsWith('audio/')) {
      return '🎵';
    } else if (mimetype.includes('pdf')) {
      return '📄';
    } else if (mimetype.includes('word') || mimetype.includes('document')) {
      return '📝';
    } else if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) {
      return '📊';
    } else if (mimetype.includes('zip') || mimetype.includes('archive')) {
      return '📦';
    }
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

  if (allItems.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CloudUpload sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {searchResults ? 'No search results found' : 'This folder is empty'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {searchResults
            ? 'Try different search terms'
            : 'Upload files or create folders to get started'}
        </Typography>
      </Box>
    );
  }

  const isAllSelected = selectedItems.length === allItems.length;
  const isIndeterminate =
    selectedItems.length > 0 && selectedItems.length < allItems.length;

  return (
    <Box>
      {/* Selection toolbar */}
      <Toolbar sx={{ minHeight: '48px !important', px: '0 !important', mb: 1 }}>
        <Checkbox
          indeterminate={isIndeterminate}
          checked={isAllSelected}
          onChange={handleSelectAll}
          sx={{ mr: 1 }}
        />
        <Button
          size="small"
          variant="text"
          startIcon={<SelectAll />}
          onClick={handleSelectAll}
          sx={{ mr: 2 }}
        >
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </Button>

        {selectedItems.length > 0 && (
          <>
            <Chip
              label={`${selectedItems.length} selected`}
              size="small"
              color="primary"
              sx={{ mr: 2 }}
            />
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<Download />}
              onClick={handleBulkDownload}
              sx={{ mr: 1 }}
            >
              Download
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleBulkDelete}
              sx={{ mr: 1 }}
            >
              Delete
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Clear />}
              onClick={handleClearSelection}
            >
              Clear
            </Button>
          </>
        )}
      </Toolbar>

      <TableContainer component={Paper} elevation={0} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Modified</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allItems.map((item) => {
              const isSelected = selectedItems.includes(item._id);

              return (
                <TableRow
                  key={`${item.type}-${item._id}`}
                  hover
                  selected={isSelected}
                  sx={{
                    cursor: item.type === 'folder' ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => {
                    if (!selectionMode) handleFileClick(item._id);
                    else handleItemSelect(item._id);
                  }}
                  onDoubleClick={() => {
                    if (item.type === 'folder') {
                      handleFolderDoubleClick(item as FolderWithType);
                    }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleItemSelect(item._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          mr: 2,
                          bgcolor:
                            item.type === 'folder'
                              ? 'primary.main'
                              : 'grey.100',
                          width: 40,
                          height: 40,
                        }}
                      >
                        {item.type === 'folder' ? (
                          <Folder />
                        ) : (
                          <span style={{ fontSize: '1.2rem' }}>
                            {getFileIcon((item as FileWithType).mimetype)}
                          </span>
                        )}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {item.type === 'file'
                            ? (item as FileWithType).originalName
                            : (item as FolderWithType).name}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {item.type === 'file' ? 'File' : 'Folder'}
                          </Typography>
                          {/* Add viewing indicator for files */}
                          {item.type === 'file' && (
                            <FileViewersIndicator
                              fileId={item._id}
                              variant="compact"
                              maxVisible={2}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.type === 'file' ? 'File' : 'Folder'}
                      size="small"
                      color={item.type === 'file' ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {item.type === 'file'
                      ? formatFileSize((item as FileWithType).size)
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, item)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        {selectedItem?.type === 'file' && (
          <MenuItem
            onClick={() => {
              handlePreview(selectedItem as FileWithType);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Preview</ListItemText>
          </MenuItem>
        )}
        {selectedItem?.type === 'file' && (
          <MenuItem
            onClick={() => {
              handleVersionHistory(selectedItem as FileWithType);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <History fontSize="small" />
            </ListItemIcon>
            <ListItemText>Version History</ListItemText>
          </MenuItem>
        )}
        {selectedItem?.type === 'folder' && (
          <MenuItem
            onClick={() => {
              onFolderClick(selectedItem._id);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <Folder fontSize="small" />
            </ListItemIcon>
            <ListItemText>Open Folder</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleShare(selectedItem!);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        {selectedItem?.type === 'file' && (
          <MenuItem
            onClick={() => {
              handleDownload(selectedItem as FileWithType);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleDelete();
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewDialogOpen}
        onClose={handleClosePreview}
        fileId={selectedFileForPreview?.id}
        fileName={selectedFileForPreview?.name}
        fileType={selectedFileForPreview?.type}
      />

      {/* Share Dialog */}
      {shareResource && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false);
            setShareResource(null);
          }}
          resourceId={shareResource.id}
          resourceType={shareResource.type}
          resourceName={shareResource.name}
        />
      )}

      {/* Version History Dialog */}
      {selectedFileForVersion && (
        <VersionHistoryDialog
          open={versionDialogOpen}
          onClose={handleCloseVersionDialog}
          fileId={selectedFileForVersion.id}
          fileName={selectedFileForVersion.name}
        />
      )}

      {/* Bulk Delete Dialog */}
      <BulkDeleteDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        selectedItems={selectedSelectableItems}
        onDeleteComplete={handleBulkDeleteComplete}
      />

      {/* Bulk Download Dialog */}
      <BulkDownloadDialog
        open={bulkDownloadDialogOpen}
        onClose={() => setBulkDownloadDialogOpen(false)}
        selectedItems={selectedSelectableItems}
        onDownloadComplete={handleBulkDownloadComplete}
      />
    </Box>
  );
};

export default FileManager;

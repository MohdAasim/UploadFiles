// /home/arslaanas/Desktop/UploadFiles/frontend/src/components/files/FileManager.tsx
/*eslint-disable */
import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import {
  useFolderTree,
  useDeleteFile,
  useDeleteFolder,
} from '../../hooks/useFiles';
import type { FileType, FolderType } from '../../types';
import { useViewing } from '../../contexts/ViewingContext';
import ShareDialog from '../dialogs/ShareDialog';
import PreviewDialog from '../dialogs/PreviewDialog';
import VersionHistoryDialog from '../dialogs/VersionHistoryDialog';
import BulkDeleteDialog from '../dialogs/BulkDeleteDialog';
import BulkDownloadDialog from '../dialogs/BulkDownloadDialog';
import MoveDialog from '../dialogs/MoveDialog';
import { ErrorLoading_Const, Loading_Const } from '../../utils/constant';
import SelectionToolbar from './filemanager/SelectionToolbar';
import FileTable from './filemanager/FileTable';
import FileContextMenu from './filemanager/FileContextMenu';
import { useFileManagerLogic } from '../../hooks/useFileManagerLogic';
import type {
  ItemWithType,
  FileWithType,
  FolderWithType,
} from '../../hooks/useFileManagerLogic';

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

const FileManager: React.FC<FileManagerProps> = ({
  currentFolder,
  onFolderClick,
  searchResults = null,
}) => {
  const { startViewing } = useViewing();
  const {
    data: folderTree,
    isLoading: treeLoading,
    error: treeError,
  } = useFolderTree(currentFolder);

  const deleteFile = useDeleteFile();
  const deleteFolder = useDeleteFolder();

  const displayData = searchResults?.data || folderTree;
  const isLoading = searchResults?.data ? false : treeLoading;
  const error = searchResults ? null : treeError;

  const files = displayData?.files || [];
  const folders = displayData?.folders || [];

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

  const logic = useFileManagerLogic(
    allItems,
    onFolderClick,
    deleteFile,
    deleteFolder
  );

  const handleFileClick = (id: string) => {
    startViewing(id);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>{Loading_Const}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{ErrorLoading_Const}</Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
      </Box>
    );
  }

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

  return (
    <Box>
      <SelectionToolbar
        isAllSelected={logic.isAllSelected}
        isIndeterminate={logic.isIndeterminate}
        selectedCount={logic.selectedItems.length}
        onSelectAll={logic.handleSelectAll}
        onBulkDownload={logic.handleBulkDownload}
        onBulkDelete={logic.handleBulkDelete}
        onBulkMove={logic.handleBulkMove}
        onClearSelection={logic.handleClearSelection}
      />
      <FileTable
        allItems={allItems.map((item) => ({
          ...item,
          createdAt: formatDistanceToNow(new Date(item.createdAt), {
            addSuffix: true,
          }),
        }))}
        selectedItems={logic.selectedItems}
        selectionMode={logic.selectionMode}
        onItemSelect={logic.handleItemSelect}
        onRowClick={handleFileClick}
        onRowDoubleClick={(item) => {
          if (item.type === 'folder')
            logic.handleFolderDoubleClick(item as FolderWithType);
        }}
        onMenuOpen={logic.handleMenuOpen}
        getFileIcon={logic.getFileIcon}
        formatFileSize={logic.formatFileSize}
        isAllSelected={logic.isAllSelected}
        isIndeterminate={logic.isIndeterminate}
        onSelectAll={logic.handleSelectAll}
      />
      <FileContextMenu
        anchorEl={logic.anchorEl}
        open={Boolean(logic.anchorEl)}
        selectedItem={logic.selectedItem}
        onClose={logic.handleMenuClose}
        onPreview={() =>
          logic.handlePreview(logic.selectedItem as FileWithType)
        }
        onVersionHistory={() =>
          logic.handleVersionHistory(logic.selectedItem as FileWithType)
        }
        onOpenFolder={() => onFolderClick(logic.selectedItem?._id)}
        onShare={() => logic.handleShare(logic.selectedItem!)}
        onDownload={() =>
          logic.handleDownload(logic.selectedItem as FileWithType)
        }
        onDelete={logic.handleDelete}
      />
      <PreviewDialog
        open={logic.previewDialogOpen}
        onClose={logic.handleClosePreview}
        fileId={logic.selectedFileForPreview?.id}
        fileName={logic.selectedFileForPreview?.name}
        fileType={logic.selectedFileForPreview?.type}
      />
      {logic.shareResource && (
        <ShareDialog
          open={logic.shareDialogOpen}
          onClose={() => {
            logic.setShareDialogOpen(false);
            logic.setShareResource(null);
          }}
          resourceId={logic.shareResource.id}
          resourceType={logic.shareResource.type}
          resourceName={logic.shareResource.name}
        />
      )}
      {logic.selectedFileForVersion && (
        <VersionHistoryDialog
          open={logic.versionDialogOpen}
          onClose={logic.handleCloseVersionDialog}
          fileId={logic.selectedFileForVersion.id}
          fileName={logic.selectedFileForVersion.name}
        />
      )}
      <BulkDeleteDialog
        open={logic.bulkDeleteDialogOpen}
        onClose={() => logic.setBulkDeleteDialogOpen(false)}
        selectedItems={logic.selectedSelectableItems}
        onDeleteComplete={logic.handleBulkDeleteComplete}
      />
      <BulkDownloadDialog
        open={logic.bulkDownloadDialogOpen}
        onClose={() => logic.setBulkDownloadDialogOpen(false)}
        selectedItems={logic.selectedSelectableItems}
        onDownloadComplete={logic.handleBulkDownloadComplete}
      />
      <MoveDialog
        open={logic.bulkMoveDialogOpen}
        onClose={() => logic.setBulkMoveDialogOpen(false)}
        selectedItems={logic.selectedSelectableItems}
        folders={folders}
        onMoveComplete={logic.handleBulkMoveComplete}
      />
    </Box>
  );
};

export default FileManager;

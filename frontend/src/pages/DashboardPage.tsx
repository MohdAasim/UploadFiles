/*eslint-disable*/
import React, { useState, useMemo } from 'react';
import { Dialog, Box, Typography } from '@mui/material';
import {
  CloudUpload,
  Folder,
  Share,
  Storage,
  FolderOpen,
  CloudQueue,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useFolders, useFolderTree } from '../hooks/useFiles';
import { useSearch } from '../hooks/useSearch';
import { useDebounce } from '../hooks/useDebounce';
import FileUpload from '../components/files/FileUpload';
import BulkUpload from '../components/files/BulkUpload';
import CreateFolderDialog from '../components/dialogs/CreateFolderDialog';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatsCards from '../components/dashboard/StatsCards';
import FileManagementSection from '../components/dashboard/FileManagementSection';
import DashboardSpeedDial from '../components/dashboard/DashboardSpeedDial';
import type { FileType } from '../types';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(
    undefined
  );
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Data hooks
  const {
    data: folderTree,
    isLoading: treeLoading,
    error: treeError,
  } = useFolderTree(currentFolder);
  const { data: allFolders } = useFolders();

  // Search hook
  const {
    updateQuery,
    searchResults,
    isLoading: searchLoading,
    error: searchError,
    updateCurrentFolder,
  } = useSearch();

  // Effects
  React.useEffect(() => {
    if (debouncedQuery !== searchQuery) return;
    updateQuery(debouncedQuery);
  }, [debouncedQuery]);

  React.useEffect(() => {
    updateCurrentFolder(currentFolder);
  }, [currentFolder]);

  const showSearchResults = debouncedQuery.length >= 2;

  // Memoized stats calculation
  const stats = useMemo(() => {
    const currentFiles = folderTree?.files || [];
    const currentFolders = folderTree?.folders || [];
    const totalFolders = allFolders || [];

    const fileCount = currentFiles.length;
    const folderCount = currentFolders.length;
    const totalFolderCount = totalFolders.length;
    const totalSize = currentFiles.reduce(
      (acc: number, f: FileType) => acc + (f.size || 0),
      0
    );
    const sizeInMB = totalSize / 1024 / 1024;

    return [
      {
        label: 'Files (Current)',
        value: fileCount.toString(),
        icon: <CloudUpload />,
        color: '#1976d2',
      },
      {
        label: 'Folders (Current)',
        value: folderCount.toString(),
        icon: <Folder />,
        color: '#2e7d32',
      },
      {
        label: 'Total Folders',
        value: totalFolderCount.toString(),
        icon: <FolderOpen />,
        color: '#ed6c02',
      },
      {
        label: 'Storage Used',
        value: sizeInMB > 0 ? `${sizeInMB.toFixed(1)} MB` : '0 MB',
        icon: <Storage />,
        color: '#9c27b0',
      },
    ];
  }, [folderTree, allFolders]);

  // Event handlers
  const handleTabChange = React.useCallback(
    (_event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
    },
    []
  );

  const handleSearchChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchQuery(value);
    },
    []
  );

  const handleClearSearch = React.useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleFolderClick = React.useCallback(
    (folderId?: string) => {
      setCurrentFolder(folderId);
      if (searchQuery) {
        setSearchQuery('');
      }
    },
    [searchQuery]
  );

  const handleUploadComplete = React.useCallback(() => {
    setTabValue(0);
  }, []);

  // Speed dial actions
  const speedDialActions = useMemo(
    () => [
      {
        name: 'Upload Files',
        icon: <CloudUpload />,
        onClick: () => setUploadDialogOpen(true),
      },
      {
        name: 'Bulk Upload',
        icon: <CloudQueue />,
        onClick: () => setBulkUploadOpen(true),
      },
      {
        name: 'New Folder',
        icon: <Folder />,
        onClick: () => setCreateFolderDialogOpen(true),
      },
      {
        name: 'Share',
        icon: <Share />,
        onClick: () => {
          toast.custom('Select a file or folder to share');
        },
      },
      {
        name: 'Bulk Actions',
        icon: <Settings />,
        onClick: () => {
          toast.custom(
            'Select files/folders in the file manager to access bulk actions'
          );
        },
      },
    ],
    []
  );

  return (
    <div>
      <DashboardHeader
        userName={user?.name}
        currentFolder={currentFolder}
        fileCount={folderTree?.fileCount || 0}
        folderCount={folderTree?.folderCount || 0}
      />

      <StatsCards stats={stats} />

      <FileManagementSection
        tabValue={tabValue}
        searchQuery={searchQuery}
        debouncedQuery={debouncedQuery}
        searchLoading={searchLoading}
        searchError={searchError}
        searchResults={searchResults}
        showSearchResults={showSearchResults}
        currentFolder={currentFolder}
        onTabChange={handleTabChange}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        onUploadDialogOpen={() => setUploadDialogOpen(true)}
        onBulkUploadOpen={() => setBulkUploadOpen(true)}
        onCreateFolderDialogOpen={() => setCreateFolderDialogOpen(true)}
        onFolderClick={handleFolderClick}
        onUploadComplete={handleUploadComplete}
      />

      {/* Dialogs */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box className="p-6">
          <Typography variant="h6" className="mb-4">
            Upload Files
          </Typography>
          <FileUpload
            parentFolder={currentFolder}
            onUploadComplete={() => {
              setUploadDialogOpen(false);
              setTabValue(0);
            }}
            maxFileSize={100}
            maxFiles={20}
          />
        </Box>
      </Dialog>

      <BulkUpload
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        parentFolder={currentFolder}
        onUploadComplete={() => {
          setBulkUploadOpen(false);
          setTabValue(0);
        }}
      />

      <CreateFolderDialog
        open={createFolderDialogOpen}
        onClose={() => setCreateFolderDialogOpen(false)}
        parentFolder={currentFolder}
      />

      <DashboardSpeedDial actions={speedDialActions} />
    </div>
  );
};

export default DashboardPage;

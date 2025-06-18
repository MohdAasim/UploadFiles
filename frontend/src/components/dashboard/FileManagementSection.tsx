/*eslint-disable*/
import React from 'react';
import { Paper, Tabs, Tab, Box } from '@mui/material';
import TabPanel from './TabPanel';
import SearchBar from './SearchBar';
import ActionButtons from './ActionButtons';
import FileManager from '../files/FileManager';
import FileUpload from '../files/FileUpload';
import Breadcrumb from '../Breadcrumb';
import { Button, Typography } from '@mui/material';
import { CloudQueue } from '@mui/icons-material';

interface FileManagementSectionProps {
  tabValue: number;
  searchQuery: string;
  debouncedQuery: string;
  searchLoading: boolean;
  searchError: Error | null;
  searchResults: any;
  showSearchResults: boolean;
  currentFolder: string | undefined;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onUploadDialogOpen: () => void;
  onBulkUploadOpen: () => void;
  onCreateFolderDialogOpen: () => void;
  onFolderClick: (folderId?: string) => void;
  onUploadComplete: () => void;
}

const FileManagementSection: React.FC<FileManagementSectionProps> = ({
  tabValue,
  searchQuery,
  debouncedQuery,
  searchLoading,
  searchError,
  searchResults,
  showSearchResults,
  currentFolder,
  onTabChange,
  onSearchChange,
  onClearSearch,
  onUploadDialogOpen,
  onBulkUploadOpen,
  onCreateFolderDialogOpen,
  onFolderClick,
  onUploadComplete,
}) => {
  return (
    <Paper className="mt-8">
      <Box className="border-b border-gray-300">
        <Tabs value={tabValue} onChange={onTabChange}>
          <Tab label="Files & Folders" />
          <Tab label="Upload Files" />
          <Tab label="Bulk Upload" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <div className="p-6">
          <SearchBar
            searchQuery={searchQuery}
            debouncedQuery={debouncedQuery}
            searchLoading={searchLoading}
            searchError={searchError}
            searchResults={searchResults}
            onSearchChange={onSearchChange}
            onClearSearch={onClearSearch}
          />

          {!showSearchResults && (
            <ActionButtons
              onUploadClick={onUploadDialogOpen}
              onBulkUploadClick={onBulkUploadOpen}
              onCreateFolderClick={onCreateFolderDialogOpen}
            />
          )}

          {!showSearchResults && (
            <Breadcrumb
              currentFolder={currentFolder}
              onFolderClick={onFolderClick}
            />
          )}

          <FileManager
            currentFolder={currentFolder}
            onFolderClick={onFolderClick}
            searchResults={showSearchResults ? searchResults : null}
          />
        </div>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <FileUpload
          parentFolder={currentFolder}
          onUploadComplete={onUploadComplete}
          maxFileSize={100}
          maxFiles={20}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <div className="p-4">
          <Button
            variant="contained"
            size="large"
            startIcon={<CloudQueue />}
            onClick={onBulkUploadOpen}
          >
            Open Bulk Upload
          </Button>
          <Typography variant="body2" color="text.secondary" className="mt-4">
            Upload entire folders with their structure preserved.
          </Typography>
        </div>
      </TabPanel>
    </Paper>
  );
};

export default FileManagementSection;

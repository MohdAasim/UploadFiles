/*eslint-disable*/
import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CloudUpload,
  FolderOpen,
  CheckCircle,
  Error,
  InsertDriveFile,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useBatchUpload } from '../../hooks/useFiles';
import TabPanel from './bulkUpload/TabPanel';
import BulkUploadFileList from './bulkUpload/BulkUploadFileList';
import BulkUploadActions from './bulkUpload/BulkUploadActions';
import {
  processFiles,
  groupFilesByFolder,
} from '../../utils/bulkUploadHelpers';
import type { FileRejection, DropEvent } from 'react-dropzone';

export interface FileWithPath {
  file: File;
  relativePath: string;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface BulkUploadProps {
  parentFolder?: string;
  onUploadComplete?: () => void;
  open: boolean;
  onClose: () => void;
}

const BulkUpload: React.FC<BulkUploadProps> = ({
  parentFolder,
  onUploadComplete,
  open,
  onClose,
}) => {
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchUpload = useBatchUpload();

  const icons = {
    CheckCircle: <CheckCircle color="success" />,
    Error: <Error color="error" />,
    CloudUpload: <CloudUpload color="primary" />,
    FolderOpen: <FolderOpen color="action" />,
  };

  const handleProcessFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles = processFiles(fileList);
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const onDrop = useCallback(
    (
      acceptedFiles: File[],
      fileRejections: FileRejection[],
      _event: DropEvent
    ) => {
      handleProcessFiles(acceptedFiles);
      fileRejections.forEach(({ file, errors }) => {
        console.error(`File ${file.name} rejected:`, errors);
      });
    },
    [handleProcessFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: tabValue === 0,
  });

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleProcessFiles(files);
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleProcessFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const fileObjects = files.map((f) => f.file);
      await batchUpload.mutateAsync({
        files: fileObjects,
        parentFolder,
        onProgress: (fileIndex: number, progress: number) => {
          setFiles((prev) =>
            prev.map((f, index) =>
              index === fileIndex
                ? {
                    ...f,
                    progress,
                    status: progress === 100 ? 'completed' : 'uploading',
                  }
                : f
            )
          );
        },
        onFileComplete: (fileIndex: number) => {
          setFiles((prev) =>
            prev.map((f, index) =>
              index === fileIndex
                ? { ...f, status: 'completed', progress: 100 }
                : f
            )
          );
        },
      });
      onUploadComplete?.();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Bulk upload failed:', err);
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? { ...f, status: 'error', error: err.message }
            : f
        )
      );
    } finally {
      setUploading(false);
    }
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'completed'));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const completedCount = files.filter((f) => f.status === 'completed').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const totalProgress =
    files.length > 0 ? (completedCount / files.length) * 100 : 0;

  const groupedFiles = groupFilesByFolder(files);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Bulk File Upload
        {files.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {files.length} files selected • {completedCount} completed •{' '}
            {errorCount} errors
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Box className="mb-3">
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
          >
            <Tab label="Upload Folders" />
            <Tab label="Upload Files" />
            <Tab label="Drag & Drop" />
          </Tabs>
          <TabPanel value={tabValue} index={0}>
            <Paper
              className="p-8 text-center cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-primary-600 hover:bg-primary-50"
              onClick={() => folderInputRef.current?.click()}
            >
              <input
                ref={folderInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFolderSelect}
                // @ts-ignore
                webkitdirectory=""
              />
              <FolderOpen
                className="text-primary-600 mb-2"
                style={{ fontSize: 48 }}
              />
              <Typography variant="h6" gutterBottom>
                Select Folders
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                className="mb-2"
              >
                Click to browse and select entire folders
              </Typography>
              <Button variant="contained" component="span">
                Choose Folders
              </Button>
            </Paper>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <Paper
              className="p-8 text-center cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-primary-600 hover:bg-primary-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <InsertDriveFile
                className="text-primary-600 mb-2"
                style={{ fontSize: 48 }}
              />
              <Typography variant="h6" gutterBottom>
                Select Multiple Files
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                className="mb-2"
              >
                Click to browse and select multiple files
              </Typography>
              <Button variant="contained" component="span">
                Choose Files
              </Button>
            </Paper>
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <Paper
              {...getRootProps()}
              className={`p-8 text-center cursor-pointer border-2 border-dashed transition-all ${
                isDragActive
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 bg-gray-50'
              } hover:border-primary-600 hover:bg-primary-50`}
            >
              <input {...getInputProps()} />
              <CloudUpload
                className="text-primary-600 mb-2"
                style={{ fontSize: 48 }}
              />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                className="mb-2"
              >
                or click to select files
              </Typography>
              <Button variant="contained" component="span">
                Select Files
              </Button>
            </Paper>
          </TabPanel>
          {files.length > 0 && uploading && (
            <Box className="mt-2">
              <Typography variant="body2" gutterBottom>
                Overall Progress: {Math.round(totalProgress)}%
              </Typography>
              <LinearProgress variant="determinate" value={totalProgress} />
            </Box>
          )}
          {files.length > 0 && (
            <BulkUploadActions
              filesLength={files.length}
              uploading={uploading}
              completedCount={completedCount}
              startUpload={startUpload}
              clearCompleted={clearCompleted}
              clearAll={clearAll}
            />
          )}
          {files.length > 0 && (
            <BulkUploadFileList
              groupedFiles={groupedFiles}
              removeFile={removeFile}
              uploading={uploading}
              icons={icons}
            />
          )}
          {files.length === 0 && (
            <Alert severity="info" className="mt-2">
              <Typography variant="body2">
                <strong>Bulk Upload Options:</strong>
                <br />• <strong>Folders:</strong> Upload entire folders with
                structure preserved
                <br />• <strong>Files:</strong> Select multiple individual files
                <br />• <strong>Drag & Drop:</strong> Drag files or folders from
                your file manager
                <br />• Progress tracking and error handling for each file
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkUpload;

/*eslint-disable*/
import React, { useCallback, useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Chip,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  CloudUpload,
  Close,
  InsertDriveFile,
  Link as LinkIcon,
  Folder,
  PlayArrow,
  Pause,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useUploadFile, useBatchUpload } from '../../hooks/useFiles';
import { useUploadContext } from '../../contexts/UploadContext';

interface FileUploadProps {
  parentFolder?: string;
  onUploadComplete?: () => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  maxFiles?: number;
}

interface UploadingFile {
  file: File;
  progress: number;
  id: string;
  status: 'waiting' | 'uploading' | 'completed' | 'error' | 'paused';
  error?: string;
  uploadedFile?: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`upload-tabpanel-${index}`}
      aria-labelledby={`upload-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const FileUpload: React.FC<FileUploadProps> = ({
  parentFolder,
  onUploadComplete,
  maxFileSize = 100, // 100MB default
  allowedTypes = [], // Empty means all types allowed
  maxFiles = 10,
}) => {
  // Create local state for this component's uploads instead of using global context
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const [tabValue, setTabValue] = useState(0);
  const [batchMode, setBatchMode] = useState(false);
  const [autoUpload, setAutoUpload] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  const intervalRefs = useRef<Map<string, number>>(new Map());
  const uploadFile = useUploadFile();
  const batchUpload = useBatchUpload();

  // File validation
  const validateFile = (file: File): string | null => {
    // Size check
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Type check
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    return null;
  };

  const updateFileProgress = (
    fileId: string,
    progress: number,
    status?: UploadingFile['status'],
    error?: string
  ) => {
    setUploadingFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? { ...file, progress, status: status || file.status, error }
          : file
      )
    );
  };

  const removeFile = (fileId: string) => {
    const interval = intervalRefs.current.get(fileId);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(fileId);
    }
    setUploadingFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const pauseUpload = (fileId: string) => {
    updateFileProgress(fileId, 0, 'paused');
    // In a real implementation, you'd pause the actual upload
  };

  const resumeUpload = (fileId: string) => {
    updateFileProgress(fileId, 0, 'uploading');
    // In a real implementation, you'd resume the actual upload
  };

  const uploadSingleFile = async (uploadingFile: UploadingFile) => {
    const formData = new FormData();
    formData.append('file', uploadingFile.file);
    if (parentFolder) {
      formData.append('parentFolder', parentFolder);
    }

    try {
      const result = await uploadFile.mutateAsync({
        formData,
        onProgress: (progress) => {
          updateFileProgress(uploadingFile.id, progress, 'uploading');
        },
      });

      updateFileProgress(uploadingFile.id, 100, 'completed');

      setTimeout(() => {
        removeFile(uploadingFile.id);
      }, 3000);

      return result;
    } catch (error: any) {
      updateFileProgress(uploadingFile.id, 0, 'error', error.message);
      return null;
    }
  };

  const processFiles = async (files: File[]) => {
    // Validate files
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        invalidFiles.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors
    if (invalidFiles.length > 0) {
      invalidFiles.forEach((error) => {
        console.error(error);
      });
    }

    // Check max files limit
    if (uploadingFiles.length + validFiles.length > maxFiles) {
      console.error(`Cannot upload more than ${maxFiles} files at once`);
      return;
    }

    // Create uploading file objects with proper typing
    const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
      file,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9),
      status: autoUpload ? ('uploading' as const) : ('waiting' as const),
    }));

    // Add to local state
    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    if (autoUpload) {
      if (batchMode) {
        // Batch upload
        try {
          await batchUpload.mutateAsync({
            files: validFiles,
            parentFolder,
            onProgress: (fileIndex, progress) => {
              const fileId = newUploadingFiles[fileIndex]?.id;
              if (fileId) {
                updateFileProgress(fileId, progress, 'uploading');
              }
            },
            onFileComplete: (fileIndex, response) => {
              const fileId = newUploadingFiles[fileIndex]?.id;
              if (fileId) {
                updateFileProgress(fileId, 100, 'completed');
                setTimeout(() => removeFile(fileId), 3000);
              }
            },
          });
        } catch (error) {
          console.error('Batch upload failed:', error);
          // Update error status for all files
          newUploadingFiles.forEach((uploadingFile) => {
            updateFileProgress(
              uploadingFile.id,
              0,
              'error',
              'Batch upload failed'
            );
          });
        }
      } else {
        // Individual uploads
        for (const uploadingFile of newUploadingFiles) {
          await uploadSingleFile(uploadingFile);
        }
      }

      onUploadComplete?.();
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsDragActive(false);
      await processFiles(acceptedFiles);
    },
    [parentFolder, autoUpload, batchMode, uploadingFiles.length]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive: dropzoneActive,
  } = useDropzone({
    onDrop,
    multiple: true,
    maxFiles,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const startManualUpload = async () => {
    const waitingFiles = uploadingFiles.filter((f) => f.status === 'waiting');

    if (batchMode) {
      const files = waitingFiles.map((f) => f.file);
      try {
        await batchUpload.mutateAsync({
          files,
          parentFolder,
          onProgress: (fileIndex, progress) => {
            const fileId = waitingFiles[fileIndex]?.id;
            if (fileId) {
              updateFileProgress(fileId, progress, 'uploading');
            }
          },
          onFileComplete: (fileIndex, response) => {
            const fileId = waitingFiles[fileIndex]?.id;
            if (fileId) {
              updateFileProgress(fileId, 100, 'completed');
              setTimeout(() => removeFile(fileId), 3000);
            }
          },
        });
      } catch (error) {
        console.error('Manual batch upload failed:', error);
      }
    } else {
      for (const uploadingFile of waitingFiles) {
        await uploadSingleFile(uploadingFile);
      }
    }

    onUploadComplete?.();
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;

    try {
      // In a real implementation, you'd have an API endpoint to handle URL uploads
      console.log('URL upload not implemented yet:', urlInput);
      setUrlInput('');
    } catch (error) {
      console.error('URL upload failed:', error);
    }
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'uploading':
        return <PlayArrow color="primary" />;
      case 'paused':
        return <Pause color="warning" />;
      case 'waiting':
        return <Info color="info" />;
      default:
        return <Info />;
    }
  };

  const getProgressColor = (
    status: UploadingFile['status']
  ): 'primary' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'paused':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Upload Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload Settings
          </Typography>

          {/* Replace Grid with Box and flexbox */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              '@media (max-width: 600px)': {
                flexDirection: 'column',
              },
            }}
          >
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoUpload}
                    onChange={(e) => setAutoUpload(e.target.checked)}
                  />
                }
                label="Auto Upload"
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={batchMode}
                    onChange={(e) => setBatchMode(e.target.checked)}
                  />
                }
                label="Batch Mode"
              />
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Max file size: {maxFileSize}MB • Max files: {maxFiles}
              {allowedTypes.length > 0 && (
                <> • Allowed types: {allowedTypes.join(', ')}</>
              )}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Upload Methods Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        >
          <Tab label="Drag & Drop" />
          <Tab label="Browse Files" />
          <Tab label="URL Upload" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Drag & Drop Zone */}
          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              border: '2px dashed',
              borderColor:
                isDragActive || dropzoneActive ? 'primary.main' : 'grey.300',
              backgroundColor:
                isDragActive || dropzoneActive ? 'primary.50' : 'grey.50',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50',
              },
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive || dropzoneActive
                ? 'Drop files here'
                : 'Drag & drop files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              or click to select files
            </Typography>
            <Button variant="contained" component="span">
              Select Files
            </Button>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* File Browser */}
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Folder sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Browse and Select Files
            </Typography>
            <Button
              variant="contained"
              component="label"
              startIcon={<InsertDriveFile />}
            >
              Choose Files
              <input
                type="file"
                hidden
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  processFiles(files);
                }}
              />
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* URL Upload */}
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Upload from URL
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter file URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      onClick={handleUrlUpload}
                      disabled={!urlInput.trim()}
                    >
                      Upload
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Enter a direct link to a file to upload it
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* Manual Upload Control */}
      {!autoUpload && uploadingFiles.some((f) => f.status === 'waiting') && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={startManualUpload}
            startIcon={<PlayArrow />}
          >
            Start Upload (
            {uploadingFiles.filter((f) => f.status === 'waiting').length} files)
          </Button>
        </Box>
      )}

      {/* Upload Progress List - FIXED */}
      {uploadingFiles.length > 0 && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Upload Progress ({uploadingFiles.length} files)
          </Typography>
          <List>
            {uploadingFiles
              .filter((uploadingFile) => uploadingFile && uploadingFile.file)
              .map((uploadingFile, index) => (
                <ListItem
                  key={uploadingFile.id || index}
                  sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}
                >
                  {/* Primary content */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      mb: 1,
                    }}
                  >
                    <Box sx={{ mr: 2 }}>
                      {getStatusIcon(uploadingFile.status)}
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                        {uploadingFile.file.name}
                      </Typography>
                      <Chip
                        label={uploadingFile.status}
                        size="small"
                        color={getProgressColor(uploadingFile.status)}
                        variant="outlined"
                      />
                    </Box>
                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      {uploadingFile.status === 'uploading' && (
                        <IconButton
                          size="small"
                          onClick={() => pauseUpload(uploadingFile.id)}
                          title="Pause"
                        >
                          <Pause />
                        </IconButton>
                      )}
                      {uploadingFile.status === 'paused' && (
                        <IconButton
                          size="small"
                          onClick={() => resumeUpload(uploadingFile.id)}
                          title="Resume"
                        >
                          <PlayArrow />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => removeFile(uploadingFile.id)}
                        title="Remove"
                      >
                        <Close />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Progress bar and status */}
                  <Box sx={{ width: '100%', pl: 6 }}>
                    <LinearProgress
                      variant="determinate"
                      value={uploadingFile.progress}
                      color={getProgressColor(uploadingFile.status)}
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {uploadingFile.status === 'error' ? (
                        <span style={{ color: 'red' }}>
                          Error: {uploadingFile.error}
                        </span>
                      ) : uploadingFile.status === 'completed' ? (
                        'Upload completed'
                      ) : (
                        `${uploadingFile.progress}% of ${formatFileSize(
                          uploadingFile.file.size
                        )}`
                      )}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
          </List>
        </Paper>
      )}

      {/* Upload Tips */}
      {uploadingFiles.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Tips:</strong>
            <br />• Use batch mode for faster uploads of multiple files • Turn
            off auto-upload to review files before uploading • You can drag and
            drop folders (browser support varies) • Use URL upload for files
            hosted on other servers
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;

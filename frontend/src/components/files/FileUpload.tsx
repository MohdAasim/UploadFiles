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
} from '@mui/material';
import { CloudUpload, Close, InsertDriveFile } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useUploadFile } from '../../hooks/useFiles';

interface FileUploadProps {
  parentFolder?: string;
  onUploadComplete?: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  id: string;
  status: 'uploading' | 'completed' | 'error';
}

const FileUpload: React.FC<FileUploadProps> = ({ parentFolder, onUploadComplete }) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const intervalRefs = useRef<Map<string, number>>(new Map());
  const uploadFile = useUploadFile();

  const updateFileProgress = (fileId: string, progress: number, status?: UploadingFile['status']) => {
    setUploadingFiles(prev => 
      prev.map(f => 
        f.id === fileId 
          ? { ...f, progress, ...(status && { status }) }
          : f
      )
    );
  };

  const removeFile = (fileId: string) => {
    // Clear any existing interval
    const interval = intervalRefs.current.get(fileId);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(fileId);
    }
    
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploadingFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9),
      status: 'uploading' as const,
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    for (const uploadingFile of newUploadingFiles) {
      const formData = new FormData();
      formData.append('file', uploadingFile.file);
      if (parentFolder) {
        formData.append('parentFolder', parentFolder);
      }

      try {
        // Start progress simulation
        const progressInterval = setInterval(() => {
          updateFileProgress(
            uploadingFile.id, 
            Math.min(uploadingFile.progress + 10, 90)
          );
        }, 200);
        
        intervalRefs.current.set(uploadingFile.id, progressInterval);

        await uploadFile.mutateAsync(formData);
        
        // Clear interval and set completion
        clearInterval(progressInterval);
        intervalRefs.current.delete(uploadingFile.id);
        
        updateFileProgress(uploadingFile.id, 100, 'completed');

        // Remove completed upload after delay
        setTimeout(() => {
          removeFile(uploadingFile.id);
        }, 2000);

        onUploadComplete?.();
      } catch (error) {
        // Clear interval on error
        const interval = intervalRefs.current.get(uploadingFile.id);
        if (interval) {
          clearInterval(interval);
          intervalRefs.current.delete(uploadingFile.id);
        }
        
        updateFileProgress(uploadingFile.id, 0, 'error');
        
        // Remove failed upload after delay
        setTimeout(() => {
          removeFile(uploadingFile.id);
        }, 3000);
        
        console.error('Upload failed:', error);
      }
    }
  }, [parentFolder, uploadFile, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const getProgressColor = (status: UploadingFile['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      default: return 'primary';
    }
  };

  return (
    <Box>
      {/* Drop Zone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'primary.50' : 'grey.50',
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
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          or click to select files
        </Typography>
        <Button variant="contained" component="span">
          Select Files
        </Button>
      </Paper>

      {/* Uploading Files List */}
      {uploadingFiles.length > 0 && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Uploading Files
          </Typography>
          <List>
            {uploadingFiles.map((uploadingFile) => (
              <ListItem key={uploadingFile.id} sx={{ px: 0 }}>
                <InsertDriveFile sx={{ mr: 2, color: 'primary.main' }} />
                <ListItemText
                  primary={uploadingFile.file.name}
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={uploadingFile.progress} 
                        color={getProgressColor(uploadingFile.status)}
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption">
                        {uploadingFile.status === 'error' ? 'Upload failed' : 
                         uploadingFile.status === 'completed' ? 'Upload completed' :
                         `${uploadingFile.progress}%`} - {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => removeFile(uploadingFile.id)}
                    size="small"
                  >
                    <Close />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default FileUpload;
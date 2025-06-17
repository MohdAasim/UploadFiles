import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  LinearProgress,
  TextField,
  Alert,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Close,
  Restore,
  CloudUpload,
  History,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useVersionHistory, useUploadNewVersion, useRestoreVersion } from '../../hooks/useVersions';
import { showConfirmation } from '../../utils/sweetAlert';
import type { FileVersion, VersionHistoryData } from '../../types';

interface VersionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
}

const VersionHistoryDialog: React.FC<VersionHistoryDialogProps> = ({
  open,
  onClose,
  fileId,
  fileName,
}) => {
  const [uploadingNewVersion, setUploadingNewVersion] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remark, setRemark] = useState('');

  const { data: versionData, isLoading, error } = useVersionHistory(fileId);
  const uploadNewVersion = useUploadNewVersion();
  const restoreVersion = useRestoreVersion();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadNewVersion = async () => {
    if (!selectedFile) return;

    setUploadingNewVersion(true);
    setUploadProgress(0);

    try {
      await uploadNewVersion.mutateAsync({
        fileId,
        file: selectedFile,
        remark: remark.trim() || undefined,
        onProgress: setUploadProgress,
      });

      // Reset form
      setSelectedFile(null);
      setRemark('');
      setUploadProgress(0);
    } catch {
      // Error handled in hook
    } finally {
      setUploadingNewVersion(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    const confirmed = await showConfirmation(
      'Restore Version?',
      `Are you sure you want to restore version ${versionNumber}? This will create a new version with the restored content.`,
      'Yes, restore it!'
    );

    if (confirmed) {
      await restoreVersion.mutateAsync({
        fileId,
        versionNumber,
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Loading version history...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Alert severity="error">
            Failed to load version history: {(error as Error).message}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const { file, versions = [] } = (versionData as VersionHistoryData) || {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <History sx={{ mr: 1 }} />
            <Typography variant="h6">Version History</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* File Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current Version: {file?.currentVersion || 1} • Total Versions: {versions.length + 1}
            </Typography>
          </CardContent>
        </Card>

        {/* Upload New Version Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload New Version
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <input
                accept="*"
                style={{ display: 'none' }}
                id="version-file-input"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="version-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  disabled={uploadingNewVersion}
                >
                  Choose File
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              label="Version Remark (optional)"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Describe what changed in this version..."
              disabled={uploadingNewVersion}
              sx={{ mb: 2 }}
            />

            {uploadingNewVersion && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Uploading: {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            <Button
              variant="contained"
              onClick={handleUploadNewVersion}
              disabled={!selectedFile || uploadingNewVersion}
              startIcon={<CloudUpload />}
            >
              {uploadingNewVersion ? 'Uploading...' : 'Upload New Version'}
            </Button>
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

        {/* Version History List */}
        <Typography variant="h6" gutterBottom>
          Version History
        </Typography>

        {versions.length === 0 ? (
          <Alert severity="info">
            No previous versions available. Upload a new version to start tracking changes.
          </Alert>
        ) : (
          <List>
            {versions.map((version: FileVersion) => (
              <ListItem key={version.versionNumber} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" component="span">
                        Version {version.versionNumber}
                      </Typography>
                      {version.versionNumber === file?.currentVersion && (
                        <Chip label="Current" size="small" color="primary" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box component="div">
                      <Typography variant="body2" color="text.secondary" component="div">
                        {version.remark || 'No description provided'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div">
                        Uploaded {formatDistanceToNow(new Date(version.uploadedAt), { addSuffix: true })}
                        {version.uploadedBy?.name && ` by ${version.uploadedBy.name}`}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {version.versionNumber !== file?.currentVersion && (
                      <IconButton
                        size="small"
                        onClick={() => handleRestoreVersion(version.versionNumber)}
                        disabled={restoreVersion.isPending}
                        title="Restore this version"
                      >
                        <Restore />
                      </IconButton>
                    )}
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {versions.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Restoring a previous version will create a new version with the restored content. 
              The current version will be preserved in the history.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionHistoryDialog;
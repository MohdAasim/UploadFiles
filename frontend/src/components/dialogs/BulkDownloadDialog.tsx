import React from 'react';
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
  ListItemIcon,
  Box,
  Alert,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  InsertDriveFile,
  Folder,
  Download,
} from '@mui/icons-material';
// Fix: Import the main hook, not individual hooks
import { useBulkActions } from '../../hooks/useBulkActions';
import type { SelectableItem } from '../../types';

interface BulkDownloadDialogProps {
  open: boolean;
  onClose: () => void;
  selectedItems: SelectableItem[];
  onDownloadComplete: () => void;
}

const BulkDownloadDialog: React.FC<BulkDownloadDialogProps> = ({
  open,
  onClose,
  selectedItems,
  onDownloadComplete,
}) => {
  // Fix: Use the main hook and destructure
  const { bulkDownload } = useBulkActions();

  const fileItems = selectedItems.filter(item => item.type === 'file');
  const folderItems = selectedItems.filter(item => item.type === 'folder');

  const handleDownload = async () => {
    try {
      await bulkDownload.mutateAsync({
        files: fileItems.map(item => item.id),
        folders: folderItems.map(item => item.id),
      });
      
      onDownloadComplete();
      onClose();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = fileItems.reduce((acc, item) => acc + (item.size || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Download color="primary" />
          <Typography variant="h6">Download Selected Items</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Download Information:</strong>
            <br />
            • Files will be downloaded individually to your browser's download folder
            <br />
            • Folders will have all their contents downloaded as separate files
            <br />
            • Downloads will be staggered to prevent browser overload
            <br />
            • Large files may take longer to prepare for download
          </Typography>
        </Alert>

        {/* Summary */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {fileItems.length > 0 && (
            <Chip
              icon={<InsertDriveFile />}
              label={`${fileItems.length} file${fileItems.length !== 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
            />
          )}
          {folderItems.length > 0 && (
            <Chip
              icon={<Folder />}
              label={`${folderItems.length} folder${folderItems.length !== 1 ? 's' : ''}`}
              color="secondary"
              variant="outlined"
            />
          )}
          {totalSize > 0 && (
            <Chip
              label={`Total size: ${formatFileSize(totalSize)}`}
              variant="outlined"
            />
          )}
        </Box>

        {/* Items List */}
        <Typography variant="subtitle1" gutterBottom>
          Items to be downloaded:
        </Typography>
        
        <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <List dense>
            {folderItems.map((item, index) => (
              <ListItem key={`folder-${index}`}>
                <ListItemIcon>
                  <Folder color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  secondary="Folder (all contents will be downloaded)"
                />
              </ListItem>
            ))}
            
            {folderItems.length > 0 && fileItems.length > 0 && (
              <Divider />
            )}
            
            {fileItems.map((item, index) => (
              <ListItem key={`file-${index}`}>
                <ListItemIcon>
                  <InsertDriveFile color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  secondary={item.size ? formatFileSize(item.size) : 'Unknown size'}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {selectedItems.length === 0 && (
          <Alert severity="info">
            No items selected for download.
          </Alert>
        )}

        {bulkDownload.isPending && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <CircularProgress size={20} sx={{ mr: 2 }} />
            <Typography variant="body2">
              Preparing downloads... This may take a moment for large files or folders.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={bulkDownload.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          color="primary"
          disabled={selectedItems.length === 0 || bulkDownload.isPending}
          startIcon={bulkDownload.isPending ? <CircularProgress size={20} /> : <Download />}
        >
          {bulkDownload.isPending ? 'Preparing...' : `Download ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkDownloadDialog;
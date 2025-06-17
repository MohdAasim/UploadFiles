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
} from '@mui/material';
import {
  InsertDriveFile,
  Folder,
  Warning,
  Delete,
} from '@mui/icons-material';
// Fix: Import the main hook, not individual hooks
import { useBulkActions } from '../../hooks/useBulkActions';
import type { SelectableItem } from '../../types';

interface BulkDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  selectedItems: SelectableItem[];
  onDeleteComplete: () => void;
}

const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  open,
  onClose,
  selectedItems,
  onDeleteComplete,
}) => {
  // Fix: Use the main hook and destructure
  const { bulkDelete } = useBulkActions();

  const fileItems = selectedItems.filter(item => item.type === 'file');
  const folderItems = selectedItems.filter(item => item.type === 'folder');

  const handleDelete = async () => {
    try {
      await bulkDelete.mutateAsync({
        files: fileItems.map(item => item.id),
        folders: folderItems.map(item => item.id),
      });
      
      onDeleteComplete();
      onClose();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Delete failed:', error);
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
          <Warning color="warning" />
          <Typography variant="h6">Delete Selected Items</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> This action cannot be undone. All selected files and folders will be permanently deleted.
            {folderItems.length > 0 && (
              <>
                <br />
                <strong>Note:</strong> Deleting folders will also delete all their contents.
              </>
            )}
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
          Items to be deleted:
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
                  secondary="Folder (all contents will be deleted)"
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
            No items selected for deletion.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={bulkDelete.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={selectedItems.length === 0 || bulkDelete.isPending}
          startIcon={<Delete />}
        >
          {bulkDelete.isPending ? 'Deleting...' : `Delete ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkDeleteDialog;
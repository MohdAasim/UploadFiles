// /home/arslaanas/Desktop/UploadFiles/frontend/src/components/dialogs/MoveDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { Folder } from '@mui/icons-material';
import { bulkAPI } from '../../services/api';
import type { FolderType, SelectableItem } from '../../types';
import { showSuccessAlert, showErrorAlert } from '../../utils/sweetAlert';
import { useQueryClient } from '@tanstack/react-query';

interface MoveDialogProps {
  open: boolean;
  onClose: () => void;
  selectedItems: SelectableItem[];
  folders: FolderType[];
  onMoveComplete: () => void;
}

const MoveDialog: React.FC<MoveDialogProps> = ({
  open,
  onClose,
  selectedItems,
  folders,
  onMoveComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('root');
  const queryClient = useQueryClient();

  // Filter out folders that are being moved to prevent circular moves
  const availableFolders = folders.filter(
    (folder) => !selectedItems.find((item) => item.id === folder._id)
  );

  const handleMove = async () => {
    try {
      setLoading(true);

      const files = selectedItems
        .filter((item) => item.type === 'file')
        .map((item) => item.id);

      const foldersToMove = selectedItems
        .filter((item) => item.type === 'folder')
        .map((item) => item.id);

      await bulkAPI.bulkMove({
        files,
        folders: foldersToMove,
        targetFolder: selectedFolder === 'root' ? '' : selectedFolder,
      });
      queryClient.invalidateQueries({ queryKey: ['folderTree'] });

      await showSuccessAlert(
        'Moved Successfully',
        `${selectedItems.length} item(s) moved successfully`
      );

      onMoveComplete();
      onClose();
    } catch (error) {
      await showErrorAlert(
        'Move Failed',
        error instanceof Error ? error.message : 'Failed to move items'
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset selected folder when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedFolder('root');
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Move {selectedItems.length} Item(s)
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Select destination folder:
        </Typography>
        <Box sx={{ minHeight: 200, maxHeight: 400, overflow: 'auto', mt: 2 }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedFolder === 'root'}
                onClick={() => setSelectedFolder('root')}
              >
                <ListItemIcon>
                  <Folder />
                </ListItemIcon>
                <ListItemText primary="Root" />
              </ListItemButton>
            </ListItem>
            {availableFolders.length > 0 && <Divider />}
            {availableFolders.map((folder) => (
              <>
                {console.log(folder,"-------------")}
                <ListItem key={folder._id} disablePadding>
                  <ListItemButton
                    selected={selectedFolder === folder._id}
                    onClick={() => setSelectedFolder(folder._id)}
                  >
                    <ListItemIcon>
                      <Folder />
                    </ListItemIcon>
                    <ListItemText primary={folder.name} />
                  </ListItemButton>
                </ListItem>
              </>
            ))}
          </List>
        </Box>
        {selectedItems.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Moving {selectedItems.length} item(s) to{' '}
            {selectedFolder === 'root'
              ? 'Root'
              : folders.find((f) => f._id === selectedFolder)?.name ||
                'selected folder'}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleMove}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Moving...' : 'Move'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoveDialog;

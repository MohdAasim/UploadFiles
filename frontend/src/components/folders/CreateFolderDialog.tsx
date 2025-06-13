import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { useCreateFolder } from '../../hooks/useFiles';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  parentFolder?: string;
}

const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  open,
  onClose,
  parentFolder,
}) => {
  const [folderName, setFolderName] = useState('');
  const createFolder = useCreateFolder();

  const handleCreate = async () => {
    if (!folderName.trim()) return;

    try {
      await createFolder.mutateAsync({
        name: folderName.trim(),
        parent: parentFolder,
      });
      setFolderName('');
      onClose();
    } catch (error) {
        console.log(error);
        
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    setFolderName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Folder</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Folder name"
          fullWidth
          variant="outlined"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleCreate();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleCreate} 
          variant="contained"
          disabled={!folderName.trim() || createFolder.isPending}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFolderDialog;
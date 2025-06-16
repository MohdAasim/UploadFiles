/*eslint-disable*/
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  FormControlLabel,
  Switch,
  Chip,
  Autocomplete,
} from '@mui/material';
import { Folder, FolderSpecial, Star } from '@mui/icons-material';
import { useCreateFolder, useFolders } from '../../hooks/useFiles';

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
  const [description, setDescription] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const createFolder = useCreateFolder();
  const { data: folders } = useFolders();

  // Predefined folder templates
  const folderTemplates = [
    { name: 'Documents', icon: '📄' },
    { name: 'Images', icon: '🖼️' },
    { name: 'Videos', icon: '🎥' },
    { name: 'Audio', icon: '🎵' },
    { name: 'Projects', icon: '📁' },
    { name: 'Archive', icon: '📦' },
    { name: 'Shared', icon: '👥' },
    { name: 'Temp', icon: '⏰' },
  ];

  // Common tags
  const commonTags = ['Work', 'Personal', 'Important', 'Archive', 'Project', 'Shared'];

  const handleClose = () => {
    setFolderName('');
    setDescription('');
    setIsTemplate(false);
    setTags([]);
    setError('');
    onClose();
  };

  const validateFolderName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Folder name is required';
    }

    if (name.length < 1) {
      return 'Folder name must be at least 1 character';
    }

    if (name.length > 100) {
      return 'Folder name must be less than 100 characters';
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      return 'Folder name contains invalid characters: < > : " / \\ | ? *';
    }

    // Check if folder already exists in current directory
    if (folders && Array.isArray(folders)) {
      const existingFolder = folders.find(
        f => f.parent === parentFolder && f.name.toLowerCase() === name.toLowerCase()
      );
      if (existingFolder) {
        return 'A folder with this name already exists';
      }
    }

    return null;
  };

  const handleCreate = async () => {
    const validation = validateFolderName(folderName);
    if (validation) {
      setError(validation);
      return;
    }

    try {
      await createFolder.mutateAsync({
        name: folderName.trim(),
        parent: parentFolder,
        // These would need to be supported by your API
        ...(description && { description }),
        ...(tags.length > 0 && { tags }),
        ...(isTemplate && { isTemplate }),
      });
      handleClose();
    } catch (error: any) {
      setError(error?.message || 'Failed to create folder');
    }
  };

  const handleTemplateSelect = (template: typeof folderTemplates[0]) => {
    setFolderName(template.name);
    setError('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleCreate();
    }
  };

  // Get parent folder name for display
  const getParentFolderName = () => {
    if (!parentFolder || !folders) return 'Root';
    const parent = folders.find(f => f._id === parentFolder);
    return parent?.name || 'Unknown Folder';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Folder color="primary" />
          <Typography variant="h6">Create New Folder</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Location Info */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Creating folder in: <strong>{getParentFolderName()}</strong>
            </Typography>
          </Alert>

          {/* Quick Templates */}
          <Typography variant="subtitle2" gutterBottom>
            Quick Templates
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {folderTemplates.map((template) => (
              <Chip
                key={template.name}
                label={`${template.icon} ${template.name}`}
                onClick={() => handleTemplateSelect(template)}
                variant="outlined"
                clickable
                size="small"
              />
            ))}
          </Box>

          {/* Folder Name */}
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            placeholder="Enter folder name"
            value={folderName}
            onChange={(e) => {
              setFolderName(e.target.value);
              setError(''); // Clear error when user types
            }}
            onKeyPress={handleKeyPress}
            error={!!error}
            helperText={error || 'Enter a name for your new folder'}
            disabled={createFolder.isPending}
            variant="outlined"
            sx={{ mb: 2 }}
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description (Optional)"
            placeholder="Describe what this folder will contain"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            variant="outlined"
            sx={{ mb: 2 }}
            disabled={createFolder.isPending}
          />

          {/* Tags */}
          <Autocomplete
            multiple
            options={commonTags}
            value={tags}
            onChange={(_, newValue) => setTags(newValue)}
            freeSolo
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags (Optional)"
                placeholder="Add tags to organize your folder"
                variant="outlined"
              />
            )}
            sx={{ mb: 2 }}
            disabled={createFolder.isPending}
          />

          {/* Template Option */}
          <FormControlLabel
            control={
              <Switch
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                disabled={createFolder.isPending}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Star fontSize="small" />
                <Typography variant="body2">
                  Make this a template folder
                </Typography>
              </Box>
            }
          />
          {isTemplate && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
              Template folders can be reused to create new folders with the same structure
            </Typography>
          )}

          {/* Tips */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Tips:</strong>
              <br />
              • Use descriptive names to keep your files organized
              <br />
              • Folder names can't contain: {`< > : " / \\ | ? *`}
              <br />
              • Add tags to make folders easier to find
              <br />
              • You can always rename or reorganize folders later
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={createFolder.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!folderName.trim() || createFolder.isPending}
          startIcon={<Folder />}
        >
          {createFolder.isPending ? 'Creating...' : 'Create Folder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFolderDialog;
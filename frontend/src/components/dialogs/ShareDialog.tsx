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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Share,
  Delete,
  PersonAdd,
  Visibility,
  Edit,
  AdminPanelSettings,
  Close,
} from '@mui/icons-material';
import { useShareResource, useFilePermissions, useFolderPermissions, useRemovePermission } from '../../hooks/useSharing';
import toast from 'react-hot-toast';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  resourceId: string;
  resourceType: 'file' | 'folder';
  resourceName: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  resourceId,
  resourceType,
  resourceName,
}) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit' | 'admin'>('view');

  const shareResource = useShareResource();
  const removePermission = useRemovePermission();
  
  // Get current permissions based on resource type
  const { 
    data: filePermissions, 
    isLoading: fileLoading, 
    error: fileError 
  } = useFilePermissions(resourceType === 'file' ? resourceId : '');
  
  const { 
    data: folderPermissions, 
    isLoading: folderLoading, 
    error: folderError 
  } = useFolderPermissions(resourceType === 'folder' ? resourceId : '');

  const permissions = resourceType === 'file' ? filePermissions : folderPermissions;
  const isLoading = resourceType === 'file' ? fileLoading : folderLoading;
  const error = resourceType === 'file' ? fileError : folderError;

  console.log('ShareDialog data:', { 
    resourceType, 
    resourceId, 
    permissions, 
    isLoading, 
    error 
  });

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await shareResource.mutateAsync({
        resourceId,
        resourceType,
        targetUserEmail: email.trim(),
        permission,
      });
      
      setEmail('');
      setPermission('view');
    } catch {
      // Error is handled by the hook
    }
  };

  const handleRemovePermission = async (userEmail: string) => {
    try {
      await removePermission.mutateAsync({
        resourceId,
        resourceType,
        targetUserEmail: userEmail,
      });
    } catch{
      // Error is handled by the hook
    }
  };

  const getPermissionIcon = (perm: string) => {
    switch (perm) {
      case 'view':
        return <Visibility fontSize="small" />;
      case 'edit':
        return <Edit fontSize="small" />;
      case 'admin':
        return <AdminPanelSettings fontSize="small" />;
      default:
        return <Visibility fontSize="small" />;
    }
  };

  const getPermissionColor = (perm: string) => {
    switch (perm) {
      case 'view':
        return 'info';
      case 'edit':
        return 'warning';
      case 'admin':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Share color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              Share {resourceType === 'file' ? 'File' : 'Folder'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {resourceName}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Share with new user */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Share with others
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user's email"
              size="small"
              error={email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
              helperText={email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Please enter a valid email' : ''}
            />
            
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Permission</InputLabel>
              <Select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit' | 'admin')}
                label="Permission"
              >
                <MenuItem value="view">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Visibility fontSize="small" />
                    View
                  </Box>
                </MenuItem>
                <MenuItem value="edit">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Edit fontSize="small" />
                    Edit
                  </Box>
                </MenuItem>
                <MenuItem value="admin">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminPanelSettings fontSize="small" />
                    Admin
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Button
            variant="contained"
            onClick={handleShare}
            disabled={!email.trim() || shareResource.isPending || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
            startIcon={shareResource.isPending ? <CircularProgress size={16} /> : <PersonAdd />}
            fullWidth
          >
            {shareResource.isPending ? 'Sharing...' : 'Share'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Current permissions */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Who has access
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Loading permissions...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Unable to load current permissions. You can still share this {resourceType}.
            </Alert>
          ) : permissions?.permissions && permissions.permissions.length > 0 ? (
            <List dense>
              {permissions.permissions.map((perm, index) => (
                <ListItem key={`${perm.user.email}-${index}`} sx={{ px: 0 }}>
                  <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                    {perm.user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <ListItemText
                    primary={perm.user.name || 'Unknown User'}
                    secondary={perm.user.email}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      icon={getPermissionIcon(perm.permission)}
                      label={perm.permission.charAt(0).toUpperCase() + perm.permission.slice(1)}
                      size="small"
                      color={getPermissionColor(perm.permission)}
                      variant="outlined"
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemovePermission(perm.user.email)}
                      disabled={removePermission.isPending}
                      color="error"
                      title="Remove access"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info" sx={{ mt: 1 }}>
              This {resourceType} hasn't been shared with anyone yet.
            </Alert>
          )}
        </Box>

        {/* Permission explanations */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            <strong>Permission levels:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • <strong>View:</strong> Can view and download
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • <strong>Edit:</strong> Can view, download, and modify
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • <strong>Admin:</strong> Can view, edit, and share with others
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
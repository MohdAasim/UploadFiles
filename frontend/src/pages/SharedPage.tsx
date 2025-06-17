import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Share,
  Folder,
  InsertDriveFile,
  MoreVert,
  Download,
  Visibility,
  Edit,
  AdminPanelSettings,
  People,
  History,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useSharedWithMe, useMySharedResources } from '../hooks/useSharing';
import PreviewDialog from '../components/dialogs/PreviewDialog';
import VersionHistoryDialog from '../components/dialogs/VersionHistoryDialog';
import { api } from '../services/api';
import { showErrorAlert } from '../utils/sweetAlert';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Resourcetype {

    type: "file";
    id: string;
    name: string;
    owner?: {
      name: string;
      email: string;
    };
    permission?: "view" | "edit" | "admin";
    sharedAt?: string;
    size?: number;
    mimetype?: string;
    path?: string;
  
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`shared-tabpanel-${index}`}
      aria-labelledby={`shared-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const SharedPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedResource, setSelectedResource] = useState<Resourcetype | null>(null);
  
  // Preview Dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);

  // Version History Dialog state
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [selectedFileForVersion, setSelectedFileForVersion] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: sharedWithMe, isLoading: sharedWithMeLoading, error: sharedWithMeError } = useSharedWithMe();
  const { data: mySharedResources, isLoading: mySharedLoading, error: mySharedError } = useMySharedResources();

  console.log(mySharedResources, "-----------------");
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, resource: Resourcetype) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedResource(resource);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedResource(null);
  };

  const handlePreview = (resource: Resourcetype) => {
    if (resource.type === "file") {
      setSelectedFileForPreview({
        id: resource.id,
        name: resource.name,
        type: resource.mimetype || "application/octet-stream",
      });
      setPreviewDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleClosePreview = () => {
    setSelectedFileForPreview(null);
    setPreviewDialogOpen(false);
  };

  const handleVersionHistory = (resource: Resourcetype) => {
    if (resource.type === 'file') {
      setSelectedFileForVersion({
        id: resource.id,
        name: resource.name,
      });
      setVersionDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleCloseVersionDialog = () => {
    setSelectedFileForVersion(null);
    setVersionDialogOpen(false);
  };

  const handleDownload = async (resource: Resourcetype) => {
    if (resource.type !== "file") return;

    try {
      const response = await api.get(`/files/preview/${resource.id}`, {
        responseType: "blob",
      });

      const blob = response.data;
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = resource.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      await showErrorAlert(
        "Download Failed",
        (error as Error)?.message || "Failed to download file"
      );
    }
    handleMenuClose();
  };

  const getFileIcon = (mimetype?: string) => {
    if (!mimetype) return <InsertDriveFile />;
    
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype.startsWith('video/')) return '🎥';
    if (mimetype.startsWith('audio/')) return '🎵';
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('word')) return '📝';
    if (mimetype.includes('excel')) return '📊';
    return '📄';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
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

  const getPermissionColor = (permission: string) => {
    switch (permission) {
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

  const renderSharedWithMeTable = () => {
    if (sharedWithMeLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (sharedWithMeError) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load shared resources: {sharedWithMeError.message}
        </Alert>
      );
    }

    const allResources = [
      ...(sharedWithMe?.files || []).map(f => ({ ...f, type: 'file' as const })),
      ...(sharedWithMe?.folders || []).map(f => ({ ...f, type: 'folder' as const }))
    ];

    if (allResources.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Share sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No files or folders shared with you
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When others share files or folders with you, they'll appear here.
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Permission</TableCell>
              <TableCell>Shared</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allResources.map((resource) => (
              <TableRow 
                key={`${resource.type}-${resource.id}`} 
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  if (resource.type === 'file') {
                    handlePreview(resource);
                  }
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {resource.type === 'folder' ? (
                        <Folder />
                      ) : (
                        <span style={{ fontSize: '1rem' }}>
                          {getFileIcon(resource.mimetype)}
                        </span>
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {resource.name}
                      </Typography>
                      {resource.type === 'file' && resource.size && (
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(resource.size)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip onClick={(e) => e.stopPropagation()}
                    label={resource.type === 'file' ? 'File' : 'Folder'}
                    size="small"
                    color={resource.type === 'file' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {resource.owner.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {resource.owner.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip onClick={(e) => e.stopPropagation()}
                    icon={getPermissionIcon(resource.permission)}
                    label={resource.permission.charAt(0).toUpperCase() + resource.permission.slice(1)}
                    size="small"
                    color={getPermissionColor(resource.permission)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(resource.sharedAt), { addSuffix: true })}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, resource as Resourcetype)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderMySharedTable = () => {
    if (mySharedLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (mySharedError) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load your shared resources: {mySharedError.message}
        </Alert>
      );
    }

    const allResources = [
      ...(mySharedResources?.files || []).map(f => ({ ...f, type: 'file' as const })),
      ...(mySharedResources?.folders || []).map(f => ({ ...f, type: 'folder' as const }))
    ];

    if (allResources.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <People sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            You haven't shared anything yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Files and folders you share with others will appear here.
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Shared With</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allResources.map((resource) => (
              <TableRow 
                key={`${resource.type}-${resource.id}`} 
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  if (resource.type === 'file') {
                    handlePreview(resource);
                  }
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {resource.type === 'folder' ? (
                        <Folder />
                      ) : (
                        <span style={{ fontSize: '1rem' }}>
                          {getFileIcon(resource.mimetype)}
                        </span>
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {resource.name}
                      </Typography>
                      {resource.type === 'file' && resource.size && (
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(resource.size)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip onClick={(e) => e.stopPropagation()}
                    label={resource.type === 'file' ? 'File' : 'Folder'}
                    size="small"
                    color={resource.type === 'file' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {resource.sharedWith.slice(0, 3).map((share, index) => (
                      <Chip onClick={(e) => e.stopPropagation()}
                        key={index}
                        label={share.user.name}
                        size="small"
                        variant="outlined"
                        avatar={<Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
                          {share.user.name.charAt(0)}
                        </Avatar>}
                      />
                    ))}
                    {resource.sharedWith.length > 3 && (
                      <Chip onClick={(e) => e.stopPropagation()}
                        label={`+${resource.sharedWith.length - 3} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, resource as Resourcetype)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shared Files & Folders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage files and folders shared with you or by you
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Share />
              </Avatar>
              <Box>
                <Typography variant="h5">
                  {((sharedWithMe?.files?.length || 0) + 
                    (sharedWithMe?.folders?.length || 0))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Shared with me
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <People />
              </Avatar>
              <Box>
                <Typography variant="h5">
                  {((mySharedResources?.files?.length || 0) + 
                    (mySharedResources?.folders?.length || 0))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Shared by me
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content */}
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Shared with me" />
            <Tab label="Shared by me" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            {renderSharedWithMeTable()}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {renderMySharedTable()}
          </TabPanel>
        </Box>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedResource?.type === 'file' && (
          <MenuItem onClick={() => handlePreview(selectedResource)}>
            <Visibility sx={{ mr: 2 }} />
            Preview
          </MenuItem>
        )}
        {selectedResource?.type === 'file' && (
          <MenuItem onClick={() => handleVersionHistory(selectedResource)}>
            <History sx={{ mr: 2 }} />
            Version History
          </MenuItem>
        )}
        {selectedResource?.type === 'file' && (
          <MenuItem onClick={() => handleDownload(selectedResource)}>
            <Download sx={{ mr: 2 }} />
            Download
          </MenuItem>
        )}
      </Menu>

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewDialogOpen}
        onClose={handleClosePreview}
        fileId={selectedFileForPreview?.id}
        fileName={selectedFileForPreview?.name}
        fileType={selectedFileForPreview?.type}
      />

      {/* Version History Dialog */}
      {selectedFileForVersion && (
        <VersionHistoryDialog
          open={versionDialogOpen}
          onClose={handleCloseVersionDialog}
          fileId={selectedFileForVersion.id}
          fileName={selectedFileForVersion.name}
        />
      )}
    </Box>
  );
};

export default SharedPage;
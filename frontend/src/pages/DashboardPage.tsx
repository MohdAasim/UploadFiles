import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Tabs,
  Tab,
  Dialog,
  Fab,
} from '@mui/material';
import { CloudUpload, Folder, Share, Storage, Add } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useFiles, useFolders } from '../hooks/useFiles';
import FileManager from '../components/files/FileManager';
import FileUpload from '../components/files/FileUpload';
import CreateFolderDialog from '../components/folders/CreateFolderDialog';
import Breadcrumb from '../components/Breadcrumb';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);

  const { data: files } = useFiles(currentFolder);
  const { data: folders } = useFolders();

  const stats = [
    { 
      label: 'Total Files', 
      value: files?.length.toString() || '0', 
      icon: <CloudUpload />, 
      color: '#1976d2' 
    },
    { 
      label: 'Folders', 
      value: folders?.length.toString() || '0', 
      icon: <Folder />, 
      color: '#2e7d32' 
    },
    { 
      label: 'Shared Files', 
      value: files?.filter(f => f.sharedWith.length > 0).length.toString() || '0', 
      icon: <Share />, 
      color: '#ed6c02' 
    },
    { 
      label: 'Storage Used', 
      value: files ? `${(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(1)} MB` : '0 MB', 
      icon: <Storage />, 
      color: '#9c27b0' 
    },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFolderClick = (folderId?: string) => {
    setCurrentFolder(folderId);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your files today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 4
        }}
      >
        {stats.map((stat, index) => (
          <Card key={index} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: `${stat.color}20`,
                    color: stat.color,
                    mr: 2,
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* File Management Section */}
      <Paper sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Files & Folders" />
            <Tab label="Upload Files" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Files
            </Button>
            <Button
              variant="outlined"
              startIcon={<Folder />}
              onClick={() => setCreateFolderDialogOpen(true)}
            >
              New Folder
            </Button>
          </Box>

          {/* Breadcrumb Navigation */}
          <Breadcrumb 
            currentFolder={currentFolder} 
            onFolderClick={handleFolderClick}
          />

          {/* File Manager */}
          <FileManager 
            currentFolder={currentFolder}
            onFolderClick={handleFolderClick}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <FileUpload 
            parentFolder={currentFolder}
            onUploadComplete={() => setTabValue(0)}
          />
        </TabPanel>
      </Paper>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateFolderDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload Files
          </Typography>
          <FileUpload 
            parentFolder={currentFolder}
            onUploadComplete={() => {
              setUploadDialogOpen(false);
              setTabValue(0);
            }}
          />
        </Box>
      </Dialog>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onClose={() => setCreateFolderDialogOpen(false)}
        parentFolder={currentFolder}
      />
    </Box>
  );
};

export default DashboardPage;
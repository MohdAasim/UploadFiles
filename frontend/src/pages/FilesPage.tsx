import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
} from "@mui/material";
import {
  CloudUpload,
  CloudQueue,
  Folder,
  FolderOpen,
} from "@mui/icons-material";
import { useCreateFolder, useFolderTree } from "../hooks/useFiles";
import FileManager from "../components/files/FileManager";
import FileUpload from "../components/files/FileUpload";
import BulkUpload from "../components/files/BulkUpload";
import Breadcrumb from "../components/Breadcrumb";

const FilesPage: React.FC = () => {
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(
    undefined
  );
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const createFolder = useCreateFolder();
  const { data: folderTree } = useFolderTree(currentFolder);

  const handleFolderClick = (folderId?: string) => {
    setCurrentFolder(folderId);
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        await createFolder.mutateAsync({
          name: newFolderName.trim(),
          parent: currentFolder,
        });
        setNewFolderName("");
        setCreateFolderDialogOpen(false);
      } catch (error) {
        console.error("Failed to create folder:", error);
      }
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Files
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {currentFolder ? (
            <>
              Browsing folder • {folderTree?.fileCount || 0} files,{" "}
              {folderTree?.folderCount || 0} folders
            </>
          ) : (
            <>
              Root directory • {folderTree?.fileCount || 0} files,{" "}
              {folderTree?.folderCount || 0} folders
            </>
          )}
        </Typography>
      </Box>

      {/* Stats Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FolderOpen sx={{ mr: 2, color: "primary.main" }} />
            <Box>
              <Typography variant="h6">
                {folderTree?.fileCount || 0} Files •{" "}
                {folderTree?.folderCount || 0} Folders
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In current directory
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Paper sx={{ p: 3 }}>
        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Files
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudQueue />}
            onClick={() => setBulkUploadOpen(true)}
          >
            Bulk Upload
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
      </Paper>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          <FileUpload
            parentFolder={currentFolder}
            onUploadComplete={() => {
              setUploadDialogOpen(false);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <BulkUpload
        parentFolder={currentFolder}
        onUploadComplete={() => {
          setBulkUploadOpen(false);
        }}
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
      />

      {/* Create Folder Dialog */}
      <Dialog
        open={createFolderDialogOpen}
        onClose={() => setCreateFolderDialogOpen(false)}
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleCreateFolder();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            disabled={createFolder.isPending}
          >
            {createFolder.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FilesPage;

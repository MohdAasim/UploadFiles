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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Folder,
  Add,
  Delete,
  FolderOpen,
  SubdirectoryArrowRight,
} from "@mui/icons-material";
import {
  useFolders,
  useCreateFolder,
  useDeleteFolder,
} from "../hooks/useFiles";
import { formatDistanceToNow } from "date-fns";
import {
  showDeleteConfirmation,
  showSuccessAlert,
  showErrorAlert,
} from "../utils/sweetAlert";

const FoldersPage: React.FC = () => {
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { data: folders, isLoading, error } = useFolders();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        await createFolder.mutateAsync({
          name: newFolderName.trim(),
        });
        setNewFolderName("");
        setCreateFolderDialogOpen(false);
      } catch (error) {
        console.error("Failed to create folder:", error);
      }
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    try {
      const confirmed = await showDeleteConfirmation(
        "Delete Folder?",
        `Are you sure you want to delete "${folderName}"? This will also delete all contents of the folder.`,
        "Yes, delete folder!"
      );

      if (confirmed) {
        await deleteFolder.mutateAsync(folderId);
        await showSuccessAlert(
          "Deleted!",
          "Folder has been deleted successfully."
        );
      }
    } catch (error: any) {
      await showErrorAlert(
        "Delete Failed",
        error?.message || "Failed to delete folder"
      );
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading folders...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading folders</Typography>
      </Box>
    );
  }

  // Separate root folders from nested folders
  const rootFolders = folders?.filter((folder) => !folder.parent) || [];
  const nestedFolders = folders?.filter((folder) => folder.parent) || [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Folders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Organize your files with folders
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <FolderOpen sx={{ mr: 2, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">{folders?.length || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Folders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Folder sx={{ mr: 2, color: "success.main" }} />
                <Box>
                  <Typography variant="h6">{rootFolders.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Root Folders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <SubdirectoryArrowRight sx={{ mr: 2, color: "warning.main" }} />
                <Box>
                  <Typography variant="h6">{nestedFolders.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nested Folders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateFolderDialogOpen(true)}
          >
            Create Folder
          </Button>
        </Box>

        {/* Folders List */}
        {folders && folders.length > 0 ? (
          <Box>
            {/* Root Folders */}
            {rootFolders.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Root Folders ({rootFolders.length})
                </Typography>
                <List>
                  {rootFolders.map((folder) => (
                    <ListItem
                      key={folder._id}
                      sx={{
                        border: 1,
                        borderColor: "grey.200",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>
                        <Folder color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={folder.name}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Created:{" "}
                              {formatDistanceToNow(new Date(folder.createdAt), {
                                addSuffix: true,
                              })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Owner: {folder.owner?.name || "Unknown"}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() =>
                            handleDeleteFolder(folder._id, folder.name)
                          }
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Nested Folders */}
            {nestedFolders.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Nested Folders ({nestedFolders.length})
                </Typography>
                <List>
                  {nestedFolders.map((folder) => (
                    <ListItem
                      key={folder._id}
                      sx={{
                        border: 1,
                        borderColor: "grey.200",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>
                        <SubdirectoryArrowRight color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={folder.name}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Created:{" "}
                              {formatDistanceToNow(new Date(folder.createdAt), {
                                addSuffix: true,
                              })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Owner: {folder.owner?.name || "Unknown"}
                            </Typography>
                            <Chip
                              label="Nested Folder"
                              size="small"
                              color="secondary"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() =>
                            handleDeleteFolder(folder._id, folder.name)
                          }
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Folder sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No folders yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first folder to organize your files
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateFolderDialogOpen(true)}
            >
              Create Folder
            </Button>
          </Box>
        )}
      </Paper>

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

export default FoldersPage;

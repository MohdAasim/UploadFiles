import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Avatar,
} from "@mui/material";
import {
  MoreVert,
  Folder,
  Download,
  Share,
  Edit,
  Delete,
  Visibility,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import {
  useFiles,
  useFolders,
  useDeleteFile,
  useDeleteFolder,
} from "../../hooks/useFiles";
import type { FileType, FolderType } from "../../types";

interface FileManagerProps {
  currentFolder?: string;
  onFolderClick?: (folderId: string) => void;
}

// Create extended types with the type property
type FileWithType = FileType & { type: "file" };
type FolderWithType = FolderType & { type: "folder" };
type ItemWithType = FileWithType | FolderWithType;

const FileManager: React.FC<FileManagerProps> = ({
  currentFolder,
  onFolderClick,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<ItemWithType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: files, isLoading: filesLoading } = useFiles(currentFolder);
  const {
    data: folders,
    isLoading: foldersLoading,
    error: foldersError,
  } = useFolders();
  const deleteFile = useDeleteFile();
  const deleteFolder = useDeleteFolder();

  // Debug logging
  console.log("FileManager - folders data:", folders);
  console.log("FileManager - folders type:", typeof folders);
  console.log("FileManager - folders isArray:", Array.isArray(folders));

  // Safe folder filtering with multiple fallbacks
  const currentFolderContents = React.useMemo(() => {
    if (!folders) {
      console.log("No folders data");
      return [];
    }

    if (!Array.isArray(folders)) {
      console.error("Folders is not an array:", folders);
      return [];
    }

    return folders.filter((folder) => folder?.parent === currentFolder);
  }, [folders, currentFolder]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    item: ItemWithType
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (!selectedItem) return;

    if (selectedItem.type === "file") {
      deleteFile.mutate(selectedItem._id);
    } else {deleteFolder.mutate(selectedItem._id);
    }
    setDeleteDialogOpen(false);
    handleMenuClose();
  };

  const handleRename = () => {
    if (!selectedItem) return;

    const name =
      selectedItem.type === "file"
        ? (selectedItem as FileWithType).originalName
        : (selectedItem as FolderWithType).name;

    setNewName(name);
    setRenameDialogOpen(true);
    handleMenuClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype?.startsWith("image/")) return "🖼️";
    if (mimetype?.startsWith("video/")) return "🎥";
    if (mimetype?.startsWith("audio/")) return "🎵";
    if (mimetype?.includes("pdf")) return "📄";
    if (mimetype?.includes("document") || mimetype?.includes("word"))
      return "📝";
    if (mimetype?.includes("spreadsheet") || mimetype?.includes("excel"))
      return "📊";
    return "📄";
  };

  // Show loading state
  if (filesLoading || foldersLoading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>Loading files and folders...</Typography>
      </Box>
    );
  }

  // Show error state
  if (foldersError) {
    console.error("Folders error:", foldersError);
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">Error loading folders</Typography>
        <Typography variant="body2" color="text.secondary">
          {foldersError.message}
        </Typography>
      </Box>
    );
  }

  // Safe array creation
  const safeFiles = Array.isArray(files) ? files : [];
  const safeFolders = Array.isArray(currentFolderContents)
    ? currentFolderContents
    : [];

  const allItems: ItemWithType[] = [
    ...safeFolders.map(
      (folder): FolderWithType => ({ ...folder, type: "folder" as const })
    ),
    ...safeFiles.map(
      (file): FileWithType => ({ ...file, type: "file" as const })
    ),
  ];

  return (
    <Box>
      {allItems.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No files or folders here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload some files or create a folder to get started
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
              xl: "repeat(5, 1fr)",
            },
            gap: 2,
          }}
        >
          {allItems.map((item) => (
            <Card
              key={item._id}
              sx={{
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
              }}
              onClick={() => {
                if (item.type === "folder") {
                  onFolderClick?.(item._id);
                }
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexGrow: 1,
                      minWidth: 0,
                    }}
                  >
                    {item.type === "folder" ? (
                      <Folder
                        sx={{ color: "primary.main", mr: 1, flexShrink: 0 }}
                      />
                    ) : (
                      <Box sx={{ mr: 1, fontSize: "1.5rem", flexShrink: 0 }}>
                        {getFileIcon((item as FileWithType).mimetype)}
                      </Box>
                    )}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.type === "file"
                        ? (item as FileWithType).originalName
                        : (item as FolderWithType).name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, item);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                {item.type === "file" && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize((item as FileWithType).size || 0)}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Avatar
                    sx={{ width: 20, height: 20, fontSize: "0.75rem", mr: 1 }}
                  >
                    {(item.type === "file"
                      ? (item as FileWithType).uploadedBy?.name
                      : (item as FolderWithType).owner?.name
                    )?.charAt(0) || "?"}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {item.type === "file"
                      ? (item as FileWithType).uploadedBy?.name
                      : (item as FolderWithType).owner?.name || "Unknown"}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </Typography>

                {item.type === "file" &&
                  (item as FileWithType).sharedWith?.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`Shared with ${
                          (item as FileWithType).sharedWith.length
                        }`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => console.log("Preview/Open")}>
          <Visibility sx={{ mr: 2 }} />
          {selectedItem?.type === "folder" ? "Open" : "Preview"}
        </MenuItem>
        <MenuItem onClick={handleRename}>
          <Edit sx={{ mr: 2 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={() => console.log("Share")}>
          <Share sx={{ mr: 2 }} />
          Share
        </MenuItem>
        {selectedItem?.type === "file" && (
          <MenuItem onClick={() => console.log("Download")}>
            <Download sx={{ mr: 2 }} />
            Download
          </MenuItem>
        )}
        <MenuItem
          onClick={() => setDeleteDialogOpen(true)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "
            {selectedItem
              ? selectedItem.type === "file"
                ? (selectedItem as FileWithType).originalName
                : (selectedItem as FolderWithType).name
              : ""}
            "?
            {selectedItem?.type === "folder" &&
              " This will also delete all contents of the folder."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
      >
        <DialogTitle>
          Rename {selectedItem?.type === "folder" ? "Folder" : "File"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New name"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => console.log("Rename to:", newName)}
            variant="contained"
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileManager;

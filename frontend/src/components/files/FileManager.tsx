/*eslint-disable */
import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
} from "@mui/material";
import {
  MoreVert,
  CloudUpload,
  Folder,
  Delete,
  Share,
  Download,
  Visibility,
  History,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import {
  useFolderTree,
  useDeleteFile,
  useDeleteFolder,
} from "../../hooks/useFiles";
import {
  showDeleteConfirmation,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/sweetAlert";
import type { FileType, FolderType } from "../../types";
import { api } from "../../services/api";
import FileViewersIndicator from "./FileViewersIndicator";
import { useViewing } from "../../contexts/ViewingContext";
import ShareDialog from "../dialogs/ShareDialog";
import PreviewDialog from "../dialogs/PreviewDialog";
import VersionHistoryDialog from '../dialogs/VersionHistoryDialog';


interface FileManagerProps {
  currentFolder?: string;
  onFolderClick: (folderId?: string) => void;
  searchResults?: {data:{
    files: FileType[];
    folders: FolderType[];
  } }| null;
}

// Create extended types with the type property
interface FileWithType extends FileType {
  type: "file";
}

interface FolderWithType extends FolderType {
  type: "folder";
}

type ItemWithType = FileWithType | FolderWithType;

const FileManager: React.FC<FileManagerProps> = ({
  currentFolder,
  onFolderClick,
  searchResults = null,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<ItemWithType | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareResource, setShareResource] = useState<{
    id: string;
    type: 'file' | 'folder';
    name: string;
  } | null>(null);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [selectedFileForVersion, setSelectedFileForVersion] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { startViewing } = useViewing();

  // Add viewing handlers
  const handleFileClick = (file: FileWithType) => {
    startViewing(file._id);
    // You can also open file preview here if needed
  };

  // Use the new hook that gets both files and folders for current folder
  const {
    data: folderTree,
    isLoading: treeLoading,
    error: treeError,
  } = useFolderTree(currentFolder);

  const deleteFile = useDeleteFile();
  const deleteFolder = useDeleteFolder();

  // Decide which data to use - search results or regular folder tree
  const displayData = searchResults?.data || folderTree;
  const isLoading = searchResults?.data ? false : treeLoading;
  const error = searchResults ? null : treeError;

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>Loading files and folders...</Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    console.error("Folder tree error:", error);
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">Error loading files and folders</Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
      </Box>
    );
  }

  // Extract files and folders from display data
  const files = displayData?.files || [];
  const folders = displayData?.folders || [];

  console.log("FileManager: Display data:", {
    files: files.length,
    folders: folders.length,
    isSearchResults: !!searchResults,
  });

  // Create combined items array
  const allItems: ItemWithType[] = [
    ...folders.map(
      (folder: FolderWithType )=> ({ ...folder, type: "folder" as const })
    ),
    ...files.map((file: FileWithType) => ({ ...file, type: "file" as const })),
  ];

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    item: ItemWithType
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    const itemName =
      selectedItem.type === "file"
        ? (selectedItem as FileWithType).originalName
        : (selectedItem as FolderWithType).name;

    const itemType = selectedItem.type === "file" ? "file" : "folder";

    try {
      const confirmed = await showDeleteConfirmation(
        `Delete ${itemType}?`,
        `Are you sure you want to delete "${itemName}"?${
          selectedItem.type === "folder"
            ? " This will also delete all contents of the folder."
            : ""
        }`,
        `Yes, delete ${itemType}!`
      );

      if (confirmed) {
        if (selectedItem.type === "file") {
          await deleteFile.mutateAsync(selectedItem._id);
        } else {
          await deleteFolder.mutateAsync(selectedItem._id);
        }

        await showSuccessAlert(
          "Deleted!",
          `${
            itemType.charAt(0).toUpperCase() + itemType.slice(1)
          } has been deleted.`
        );
      }
    } catch (error: any) {
      await showErrorAlert(
        "Delete Failed",
        error?.message || `Failed to delete ${itemType}`
      );
    }

    handleMenuClose();
  };

  const handlePreview = async (file: FileWithType) => {
    setSelectedFileForPreview({
      id: file._id,
      name: file.originalName,
      type: file.mimetype,
    });
    setPreviewDialogOpen(true);
  };

  const handleClosePreview = () => {
    setSelectedFileForPreview(null);
    setPreviewDialogOpen(false);
  };

  const handleDownload = async (file: FileWithType) => {
    try {
      const response = await api.get(`/files/preview/${file._id}`, {
        responseType: "blob",
      });

      const blob = response.data;
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error: any) {
      await showErrorAlert(
        "Download Failed",
        error?.message || "Failed to download file"
      );
    }
  };

  const handleFolderDoubleClick = (folder: FolderWithType) => {
    onFolderClick(folder._id);
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith("image/")) {
      return "🖼️";
    } else if (mimetype.startsWith("video/")) {
      return "🎥";
    } else if (mimetype.startsWith("audio/")) {
      return "🎵";
    } else if (mimetype.includes("pdf")) {
      return "📄";
    } else if (mimetype.includes("word") || mimetype.includes("document")) {
      return "📝";
    } else if (mimetype.includes("excel") || mimetype.includes("spreadsheet")) {
      return "📊";
    } else if (mimetype.includes("zip") || mimetype.includes("archive")) {
      return "📦";
    }
    return "📄";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleShare = (item: ItemWithType) => {
    setShareResource({
      id: item._id,
      type: item.type,
      name:
        item.type === "file"
          ? (item as FileWithType).originalName
          : (item as FolderWithType).name,
    });
    setShareDialogOpen(true);
    handleMenuClose();
  };

  const handleVersionHistory = (file: FileWithType) => {
    setSelectedFileForVersion({
      id: file._id,
      name: file.originalName,
    });
    setVersionDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseVersionDialog = () => {
    setSelectedFileForVersion(null);
    setVersionDialogOpen(false);
  };

  if (allItems.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CloudUpload sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {searchResults ? "No search results found" : "This folder is empty"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {searchResults
            ? "Try different search terms"
            : "Upload files or create folders to get started"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} elevation={0} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Modified</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allItems.map((item) => (
              <TableRow
                key={`${item.type}-${item._id}`}
                hover
                sx={{
                  cursor: item.type === "folder" ? "pointer" : "default",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
                onDoubleClick={() => {
                  if (item.type === "folder") {
                    handleFolderDoubleClick(item as FolderWithType);
                  }
                }}
                onClick={() => {
                  if (item.type === "file") {
                    handleFileClick(item as FileWithType);
                  }
                }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      sx={{
                        mr: 2,
                        bgcolor:
                          item.type === "folder" ? "primary.main" : "grey.100",
                        width: 40,
                        height: 40,
                      }}
                    >
                      {item.type === "folder" ? (
                        <Folder />
                      ) : (
                        <span style={{ fontSize: "1.2rem" }}>
                          {getFileIcon((item as FileWithType).mimetype)}
                        </span>
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {item.type === "file"
                          ? (item as FileWithType).originalName
                          : (item as FolderWithType).name}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {item.type === "file" ? "File" : "Folder"}
                        </Typography>
                        {/* Add viewing indicator for files */}
                        {item.type === "file" && (
                          <FileViewersIndicator
                            fileId={item._id}
                            variant="compact"
                            maxVisible={2}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.type === "file" ? "File" : "Folder"}
                    size="small"
                    color={item.type === "file" ? "primary" : "secondary"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {item.type === "file"
                    ? formatFileSize((item as FileWithType).size)
                    : "-"}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, item)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        {selectedItem?.type === "file" && (
          <MenuItem
            onClick={() => {
              handlePreview(selectedItem as FileWithType);
              handleMenuClose();
            }}
          >
            <Visibility sx={{ mr: 2 }} />
            Preview
          </MenuItem>
        )}
        {selectedItem?.type === "file" && (
          <MenuItem onClick={() => handleVersionHistory(selectedItem as FileWithType)}>
            <History sx={{ mr: 2 }} />
            Version History
          </MenuItem>
        )}
        {selectedItem?.type === "folder" && (
          <MenuItem
            onClick={() => {
              onFolderClick(selectedItem._id);
              handleMenuClose();
            }}
          >
            <Folder sx={{ mr: 2 }} />
            Open Folder
          </MenuItem>
        )}
        <MenuItem onClick={() => handleShare(selectedItem!)}>
          <Share sx={{ mr: 2 }} />
          Share
        </MenuItem>
        {selectedItem?.type === "file" && (
          <MenuItem
            onClick={() => {
              handleDownload(selectedItem as FileWithType);
              handleMenuClose();
            }}
          >
            <Download sx={{ mr: 2 }} />
            Download
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <Delete sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Preview Dialog - Now using the simplified component */}
      <PreviewDialog
        open={previewDialogOpen}
        onClose={handleClosePreview}
        fileId={selectedFileForPreview?.id}
        fileName={selectedFileForPreview?.name}
        fileType={selectedFileForPreview?.type}
      />

      {/* Share Dialog */}
      {shareResource && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false);
            setShareResource(null);
          }}
          resourceId={shareResource.id}
          resourceType={shareResource.type}
          resourceName={shareResource.name}
        />
      )}

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

export default FileManager;

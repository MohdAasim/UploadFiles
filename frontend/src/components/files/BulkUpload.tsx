/*eslint-disable*/
import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import {
  CloudUpload,
  Close,
  FolderOpen,
  CheckCircle,
  Error,
  Warning,
  InsertDriveFile,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { useBatchUpload } from "../../hooks/useFiles";

interface BulkUploadProps {
  parentFolder?: string;
  onUploadComplete?: () => void;
  open: boolean;
  onClose: () => void;
}

interface FileWithPath {
  file: File;
  relativePath: string;
  id: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
}

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
      id={`bulk-upload-tabpanel-${index}`}
      aria-labelledby={`bulk-upload-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const BulkUpload: React.FC<BulkUploadProps> = ({
  parentFolder,
  onUploadComplete,
  open,
  onClose,
}) => {
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchUpload = useBatchUpload();

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    const newFiles: FileWithPath[] = filesArray.map((file, index) => {
      // Get relative path from webkitRelativePath or use file name
      const relativePath = (file as any).webkitRelativePath || file.name;

      return {
        file,
        relativePath,
        id: `${Date.now()}-${index}`,
        status: "pending" as const,
        progress: 0,
      };
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      processFiles(acceptedFiles);

      // Handle rejected files
      fileRejections.forEach(({ file, errors }) => {
        console.error(`File ${file.name} rejected:`, errors);
      });
    },
    [processFiles]
  );

  // Regular dropzone for individual files
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: tabValue === 0, // Disable click when on folder tab
  });

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processFiles(files);
    }
    // Reset the input so the same folder can be selected again
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processFiles(files);
    }
    // Reset the input so the same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const startUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      const fileObjects = files.map((f) => f.file);

      await batchUpload.mutateAsync({
        files: fileObjects,
        parentFolder,
        onProgress: (fileIndex, progress) => {
          setFiles((prev) =>
            prev.map((f, index) =>
              index === fileIndex
                ? {
                    ...f,
                    progress,
                    status: progress === 100 ? "completed" : "uploading",
                  }
                : f
            )
          );
        },
        onFileComplete: (fileIndex, response) => {
          setFiles((prev) =>
            prev.map((f, index) =>
              index === fileIndex
                ? { ...f, status: "completed", progress: 100 }
                : f
            )
          );
        },
      });

      onUploadComplete?.();
    } catch (error: any) {
      console.error("Bulk upload failed:", error);
      // Mark failed files
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "error", error: error.message }
            : f
        )
      );
    } finally {
      setUploading(false);
    }
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== "completed"));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const getStatusIcon = (status: FileWithPath["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle color="success" />;
      case "error":
        return <Error color="error" />;
      case "uploading":
        return <CloudUpload color="primary" />;
      default:
        return <FolderOpen color="action" />;
    }
  };

  const getStatusColor = (
    status: FileWithPath["status"]
  ): "default" | "primary" | "success" | "error" => {
    switch (status) {
      case "completed":
        return "success";
      case "error":
        return "error";
      case "uploading":
        return "primary";
      default:
        return "default";
    }
  };

  const getProgressColor = (
    status: FileWithPath["status"]
  ): "primary" | "secondary" | "error" | "info" | "success" | "warning" | "inherit" => {
    switch (status) {
      case "completed":
        return "success";
      case "error":
        return "error";
      case "uploading":
        return "primary";
      default:
        return "primary";
    }
  };

  const completedCount = files.filter((f) => f.status === "completed").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const totalProgress =
    files.length > 0 ? (completedCount / files.length) * 100 : 0;

  // Group files by folder structure for better display
  const groupedFiles = files.reduce(
    (acc, file) => {
      const pathParts = file.relativePath.split("/");
      const folder = pathParts.length > 1 ? pathParts[0] : "Root";

      if (!acc[folder]) {
        acc[folder] = [];
      }
      acc[folder].push(file);
      return acc;
    },
    {} as Record<string, FileWithPath[]>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Bulk File Upload
        {files.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {files.length} files selected • {completedCount} completed •{" "}
            {errorCount} errors
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {/* Upload Method Tabs */}
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
          >
            <Tab label="Upload Folders" />
            <Tab label="Upload Files" />
            <Tab label="Drag & Drop" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {/* Folder Upload */}
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                border: "2px dashed",
                borderColor: "grey.300",
                backgroundColor: "grey.50",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: "primary.50",
                },
              }}
              onClick={() => folderInputRef.current?.click()}
            >
              <input
                ref={folderInputRef}
                type="file"
                {...({ webkitdirectory: "" } as any)}
                multiple
                style={{ display: "none" }}
                onChange={handleFolderSelect}
              />
              <FolderOpen sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Select Folders
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click to browse and select entire folders
              </Typography>
              <Button variant="contained" component="span">
                Choose Folders
              </Button>
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* File Upload */}
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                border: "2px dashed",
                borderColor: "grey.300",
                backgroundColor: "grey.50",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: "primary.50",
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <InsertDriveFile sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Select Multiple Files
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click to browse and select multiple files
              </Typography>
              <Button variant="contained" component="span">
                Choose Files
              </Button>
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* Drag & Drop Zone */}
            <Paper
              {...getRootProps()}
              sx={{
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                border: "2px dashed",
                borderColor: isDragActive ? "primary.main" : "grey.300",
                backgroundColor: isDragActive ? "primary.50" : "grey.50",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: "primary.50",
                },
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? "Drop files here" : "Drag & drop files here"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to select files
              </Typography>
              <Button variant="contained" component="span">
                Select Files
              </Button>
            </Paper>
          </TabPanel>

          {/* Overall Progress */}
          {files.length > 0 && uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Overall Progress: {Math.round(totalProgress)}%
              </Typography>
              <LinearProgress variant="determinate" value={totalProgress} />
            </Box>
          )}

          {/* Action Buttons */}
          {files.length > 0 && (
            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                onClick={startUpload}
                disabled={uploading}
                startIcon={<CloudUpload />}
              >
                Upload All ({files.length})
              </Button>
              <Button
                variant="outlined"
                onClick={clearCompleted}
                disabled={completedCount === 0}
              >
                Clear Completed
              </Button>
              <Button
                variant="outlined"
                onClick={clearAll}
                disabled={uploading}
              >
                Clear All
              </Button>
            </Box>
          )}

          {/* Files List - Grouped by Folder */}
          {files.length > 0 && (
            <Paper sx={{ mt: 2, maxHeight: 400, overflow: "auto" }}>
              <List>
                {Object.entries(groupedFiles).map(([folderName, folderFiles]) => (
                  <React.Fragment key={folderName}>
                    {/* Folder Header */}
                    <ListItem sx={{ bgcolor: "grey.100" }}>
                      <FolderOpen sx={{ mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {folderName} ({folderFiles.length} files)
                      </Typography>
                    </ListItem>

                    {/* Files in Folder */}
                    {folderFiles.map((fileWithPath) => (
                      <ListItem key={fileWithPath.id} divider sx={{ pl: 4 }}>
                        <Box sx={{ mr: 2 }}>
                          {getStatusIcon(fileWithPath.status)}
                        </Box>
                        <ListItemText
                          primary={
                            <Box
                              sx={{ display: "flex", alignItems: "center", gap: 1 }}
                            >
                              <Typography variant="body2" noWrap>
                                {fileWithPath.relativePath.split("/").pop()}
                              </Typography>
                              <Chip
                                label={fileWithPath.status}
                                size="small"
                                color={getStatusColor(fileWithPath.status)}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              {fileWithPath.status === "uploading" && (
                                <LinearProgress
                                  variant="determinate"
                                  value={fileWithPath.progress}
                                  color={getProgressColor(fileWithPath.status)}
                                  sx={{ mt: 0.5, mb: 0.5 }}
                                />
                              )}
                              <Typography variant="caption" color="text.secondary">
                                {fileWithPath.error ? (
                                  <span style={{ color: "red" }}>
                                    Error: {fileWithPath.error}
                                  </span>
                                ) : (
                                  `${(fileWithPath.file.size / 1024 / 1024).toFixed(
                                    2
                                  )} MB • ${fileWithPath.relativePath}`
                                )}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => removeFile(fileWithPath.id)}
                            disabled={uploading}
                          >
                            <Close />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}

          {/* Info Alert */}
          {files.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Bulk Upload Options:</strong>
                <br />
                • <strong>Folders:</strong> Upload entire folders with structure
                preserved
                <br />
                • <strong>Files:</strong> Select multiple individual files
                <br />
                • <strong>Drag & Drop:</strong> Drag files or folders from your file
                manager
                <br />
                • Progress tracking and error handling for each file
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          {uploading ? "Uploading..." : "Close"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkUpload;

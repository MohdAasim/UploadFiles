import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Chip,
  Button,
  Collapse,
  Badge,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  PlayArrow,
  Pause,
  Stop,
  Clear,
  CloudUpload,
  CheckCircle,
  Error,
  Close,
} from "@mui/icons-material";

interface QueueItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: "waiting" | "uploading" | "paused" | "completed" | "error";
  error?: string;
  uploadSpeed?: string;
  timeRemaining?: string;
}

interface UploadQueueProps {
  items: QueueItem[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  totalProgress?: number;
}

const UploadQueue: React.FC<UploadQueueProps> = ({
  items,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onClearCompleted,
  onClearAll,
  totalProgress = 0,
}) => {
  const [expanded, setExpanded] = useState(true);

  const activeUploads = items.filter(
    (item) => item.status === "uploading"
  ).length;
  const completedUploads = items.filter(
    (item) => item.status === "completed"
  ).length;
  const errorUploads = items.filter((item) => item.status === "error").length;
  const pausedUploads = items.filter((item) => item.status === "paused").length;
  const waitingUploads = items.filter(
    (item) => item.status === "waiting"
  ).length;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: QueueItem["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle color="success" sx={{ fontSize: 20 }} />;
      case "error":
        return <Error color="error" sx={{ fontSize: 20 }} />;
      case "uploading":
        return <CircularProgress size={20} />;
      case "paused":
        return <Pause color="warning" sx={{ fontSize: 20 }} />;
      case "waiting":
        return <CloudUpload color="info" sx={{ fontSize: 20 }} />;
      default:
        return <CloudUpload sx={{ fontSize: 20 }} />;
    }
  };

  const getChipColor = (
    status: QueueItem["status"]
  ): "default" | "primary" | "success" | "error" | "warning" => {
    switch (status) {
      case "completed":
        return "success";
      case "error":
        return "error";
      case "uploading":
        return "primary";
      case "paused":
        return "warning";
      default:
        return "default";
    }
  };

  const getProgressColor = (
    status: QueueItem["status"]
  ):
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning"
    | "inherit" => {
    switch (status) {
      case "completed":
        return "success";
      case "error":
        return "error";
      case "paused":
        return "warning";
      default:
        return "primary";
    }
  };

  if (items.length === 0) return null;

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        width: { xs: "calc(100vw - 32px)", sm: 450 },
        maxWidth: 450,
        maxHeight: "60vh",
        zIndex: 1300,
        border: 1,
        borderColor: "divider",
        boxShadow: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "background.paper",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Badge badgeContent={activeUploads} color="primary">
            <CloudUpload color="primary" />
          </Badge>
          <Typography variant="h6">Upload Queue</Typography>
          <Chip label={`${items.length} files`} size="small" />
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Content */}
      <Collapse in={expanded}>
        {/* Overall Progress */}
        {activeUploads > 0 && (
          <Box sx={{ p: 2, bgcolor: "primary.50" }}>
            <Typography variant="body2" gutterBottom>
              Overall Progress: {Math.round(totalProgress)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={totalProgress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Statistics */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {activeUploads > 0 && (
              <Chip
                label={`${activeUploads} uploading`}
                size="small"
                color="primary"
                icon={<CircularProgress size={12} color="inherit" />}
              />
            )}
            {waitingUploads > 0 && (
              <Chip
                label={`${waitingUploads} waiting`}
                size="small"
                color="default"
              />
            )}
            {pausedUploads > 0 && (
              <Chip
                label={`${pausedUploads} paused`}
                size="small"
                color="warning"
              />
            )}
            {completedUploads > 0 && (
              <Chip
                label={`${completedUploads} completed`}
                size="small"
                color="success"
              />
            )}
            {errorUploads > 0 && (
              <Chip
                label={`${errorUploads} errors`}
                size="small"
                color="error"
              />
            )}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ p: 1, borderBottom: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              size="small"
              variant="outlined"
              onClick={onClearCompleted}
              disabled={completedUploads === 0}
              startIcon={<Clear />}
            >
              Clear Completed
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={onClearAll}
              disabled={activeUploads > 0}
              startIcon={<Stop />}
              color="error"
            >
              Clear All
            </Button>
          </Box>
        </Box>

        {/* Queue List */}
        <Box sx={{ maxHeight: 300, overflow: "auto" }}>
          <List dense>
            {items.map((item) => (
              <ListItem key={item.id} divider>
                <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                  {getStatusIcon(item.status)}
                </Avatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {item.fileName}
                      </Typography>
                      <Chip
                        label={item.status}
                        size="small"
                        color={getChipColor(item.status)}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box component="div" sx={{ mt: 0.5 }}>
                      {(item.status === "uploading" ||
                        item.status === "paused") && (
                        <LinearProgress
                          variant="determinate"
                          value={item.progress}
                          color={getProgressColor(item.status)}
                          sx={{ mb: 0.5, height: 4, borderRadius: 2 }}
                        />
                      )}
                      <Typography variant="caption" color="text.secondary" component="div">
                        {item.error ? (
                          <Typography component="span" sx={{ color: "error.main" }}>
                            Error: {item.error}
                          </Typography>
                        ) : item.status === "completed" ? (
                          `Completed • ${formatFileSize(item.fileSize)}`
                        ) : item.status === "uploading" ? (
                          `${item.progress}% • ${formatFileSize(
                            item.fileSize
                          )}${
                            item.uploadSpeed ? ` • ${item.uploadSpeed}` : ""
                          }${
                            item.timeRemaining ? ` • ${item.timeRemaining}` : ""
                          }`
                        ) : (
                          `${formatFileSize(item.fileSize)}`
                        )}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: "flex" }}>
                    {item.status === "uploading" && (
                      <IconButton
                        size="small"
                        onClick={() => onPause(item.id)}
                        title="Pause"
                      >
                        <Pause />
                      </IconButton>
                    )}
                    {item.status === "paused" && (
                      <IconButton
                        size="small"
                        onClick={() => onResume(item.id)}
                        title="Resume"
                      >
                        <PlayArrow />
                      </IconButton>
                    )}
                    {item.status === "error" && (
                      <IconButton
                        size="small"
                        onClick={() => onRetry(item.id)}
                        title="Retry"
                        color="primary"
                      >
                        <PlayArrow />
                      </IconButton>
                    )}
                    {(item.status === "waiting" ||
                      item.status === "error" ||
                      item.status === "completed") && (
                      <IconButton
                        size="small"
                        onClick={() => onCancel(item.id)}
                        title="Remove"
                      >
                        <Close />
                      </IconButton>
                    )}
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default UploadQueue;

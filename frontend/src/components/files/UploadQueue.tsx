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
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  PlayArrow,
  Pause,
  Stop,
  Clear,
  CloudUpload,
} from "@mui/icons-material";

interface QueueItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: "waiting" | "uploading" | "paused" | "completed" | "error";
  error?: string;
}

interface UploadQueueProps {
  items: QueueItem[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
}

const UploadQueue: React.FC<UploadQueueProps> = ({
  items,
  onPause,
  onResume,
  onCancel,
  onClearCompleted,
  onClearAll,
}) => {
  const [expanded, setExpanded] = useState(true);

  const activeUploads = items.filter(
    (item) => item.status === "uploading"
  ).length;
  const completedUploads = items.filter(
    (item) => item.status === "completed"
  ).length;
  const errorUploads = items.filter((item) => item.status === "error").length;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Fix: Separate functions for Chip and LinearProgress colors
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
  ): "primary" | "secondary" | "error" | "info" | "success" | "warning" | "inherit" => {
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
        return "primary"; // Use "primary" instead of "default"
    }
  };

  if (items.length === 0) return null;

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        width: 400,
        maxHeight: 500,
        zIndex: 1000,
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
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CloudUpload color="primary" />
          <Typography variant="h6">Upload Queue</Typography>
          <Badge badgeContent={activeUploads} color="primary">
            <Chip label={`${items.length} files`} size="small" />
          </Badge>
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Content */}
      <Collapse in={expanded}>
        {/* Statistics */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`${activeUploads} uploading`}
              size="small"
              color="primary"
            />
            <Chip
              label={`${completedUploads} completed`}
              size="small"
              color="success"
            />
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
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", gap: 1 }}>
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
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {item.fileName}
                      </Typography>
                      <Chip
                        label={item.status}
                        size="small"
                        color={getChipColor(item.status)} // Use getChipColor for Chip
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      {(item.status === "uploading" ||
                        item.status === "paused") && (
                        <LinearProgress
                          variant="determinate"
                          value={item.progress}
                          color={getProgressColor(item.status)} // Use getProgressColor for LinearProgress
                          sx={{ mb: 0.5 }}
                        />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {item.error ? (
                          <span style={{ color: "red" }}>
                            Error: {item.error}
                          </span>
                        ) : (
                          <>
                            {item.progress}% • {formatFileSize(item.fileSize)}
                          </>
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
                    {(item.status === "waiting" || item.status === "error") && (
                      <IconButton
                        size="small"
                        onClick={() => onCancel(item.id)}
                        title="Cancel"
                      >
                        <Stop />
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

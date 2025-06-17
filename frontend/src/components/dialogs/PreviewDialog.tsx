import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  Close,
  OpenInNew,
  Download,
  InsertDriveFile,
} from "@mui/icons-material";

interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  fileId?: string;
  fileName?: string;
  fileType?: string;
  previewUrl?: string;
}

const PreviewDialog: React.FC<PreviewDialogProps> = ({
  open,
  onClose,
  fileId,
  fileName = "File Preview",
  fileType,
  previewUrl,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [previewContent, setPreviewContent] = React.useState<{
    url: string;
    type: string;
  } | null>(null);

  // Load preview content when dialog opens
  React.useEffect(() => {
    if (open && fileId && !previewUrl) {
      loadPreview();
    } else if (open && previewUrl && fileType) {
      setPreviewContent({ url: previewUrl, type: fileType });
    }

    return () => {
      // Cleanup blob URL when dialog closes
      if (previewContent?.url && previewContent.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewContent.url);
        setPreviewContent(null);
      }
    };
  }, [open, fileId, previewUrl]);

  const loadPreview = async () => {
    if (!fileId) return;

    setLoading(true);
    try {
      // Import api here to avoid circular dependencies
      const { api } = await import("../../services/api");
      
      const response = await api.get(`/files/preview/${fileId}`, {
        responseType: "blob",
      });

      const blob = response.data;
      const url = URL.createObjectURL(blob);
      
      // Get content type from response or use a default
      const contentType = response.headers['content-type'] || fileType || 'application/octet-stream';

      setPreviewContent({
        url,
        type: contentType,
      });
    } catch (error) {
      console.error("Preview error:", error);
      // Handle error by showing error state
      setPreviewContent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (previewContent?.url) {
      const link = document.createElement("a");
      link.href = previewContent.url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (fileId) {
      try {
        const { api } = await import("../../services/api");
        const response = await api.get(`/files/preview/${fileId}`, {
          responseType: "blob",
        });

        const blob = response.data;
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download error:", error);
      }
    }
  };

  const renderPreviewContent = () => {
    if (!previewContent) return null;

    const { url, type } = previewContent;

    if (type.startsWith("image/")) {
      return (
        <img
          src={url}
          alt={fileName}
          style={{
            maxWidth: "100%",
            maxHeight: "70vh",
            objectFit: "contain",
          }}
        />
      );
    }

    if (type.startsWith("video/")) {
      return (
        <video
          src={url}
          controls
          style={{
            maxWidth: "100%",
            maxHeight: "70vh",
          }}
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (type.startsWith("audio/")) {
      return (
        <audio src={url} controls style={{ width: "100%" }}>
          Your browser does not support the audio tag.
        </audio>
      );
    }

    if (type === "application/pdf") {
      return (
        <iframe
          src={url}
          style={{
            width: "100%",
            height: "70vh",
            border: "none",
          }}
          title={fileName}
        />
      );
    }

    if (type.startsWith("text/") || type === "application/json") {
      return (
        <iframe
          src={url}
          style={{
            width: "100%",
            height: "70vh",
            border: "1px solid #ccc",
          }}
          title={fileName}
        />
      );
    }

    // For other file types, show download option
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <InsertDriveFile sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Preview not available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This file type cannot be previewed in the browser.
        </Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleDownload}
        >
          Download File
        </Button>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" component="div" noWrap>
          {fileName}
        </Typography>
        <Box>
          {previewContent && (
            <IconButton
              onClick={() => {
                const link = document.createElement("a");
                link.href = previewContent.url;
                link.target = "_blank";
                link.click();
              }}
              title="Open in new tab"
            >
              <OpenInNew />
            </IconButton>
          )}
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Loading preview...</Typography>
          </Box>
        ) : previewContent ? (
          renderPreviewContent()
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="error">Failed to load preview</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button startIcon={<Download />} onClick={handleDownload}>
          Download
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewDialog;
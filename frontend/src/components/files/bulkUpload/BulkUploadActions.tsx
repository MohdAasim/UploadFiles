import React from 'react';
import { Box, Button } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface BulkUploadActionsProps {
  filesLength: number;
  uploading: boolean;
  completedCount: number;
  startUpload: () => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

const BulkUploadActions: React.FC<BulkUploadActionsProps> = ({
  filesLength,
  uploading,
  completedCount,
  startUpload,
  clearCompleted,
  clearAll,
}) => (
  <Box className="mt-2 flex gap-2">
    <Button
      variant="contained"
      onClick={startUpload}
      disabled={uploading}
      startIcon={<CloudUpload />}
    >
      Upload All ({filesLength})
    </Button>
    <Button
      variant="outlined"
      onClick={clearCompleted}
      disabled={completedCount === 0}
    >
      Clear Completed
    </Button>
    <Button variant="outlined" onClick={clearAll} disabled={uploading}>
      Clear All
    </Button>
  </Box>
);

export default BulkUploadActions;

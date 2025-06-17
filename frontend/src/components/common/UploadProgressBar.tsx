import React from 'react';
import { Box, LinearProgress, Typography, Fade } from '@mui/material';
import { useUploadContext } from '../../contexts/UploadContext';

const UploadProgressBar: React.FC = () => {
  const { uploads, totalProgress } = useUploadContext();

  const activeUploads = uploads.filter(
    (upload) => upload.status === 'uploading'
  );

  if (activeUploads.length === 0) return null;

  return (
    <Fade in={activeUploads.length > 0}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1400,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          p: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ minWidth: 'fit-content' }}
          >
            Uploading {activeUploads.length} file
            {activeUploads.length > 1 ? 's' : ''}...
          </Typography>
          <LinearProgress
            variant="determinate"
            value={totalProgress}
            sx={{ flex: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="body2" color="text.secondary">
            {Math.round(totalProgress)}%
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
};

export default UploadProgressBar;

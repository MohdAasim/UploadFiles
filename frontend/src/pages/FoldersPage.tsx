import React from 'react';
import { Box, Typography } from '@mui/material';

const FoldersPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Folders
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Folder management will be implemented here.
      </Typography>
    </Box>
  );
};

export default FoldersPage;
import React from 'react';
import { Box, Typography } from '@mui/material';

const FilesPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Files
      </Typography>
      <Typography variant="body1" color="text.secondary">
        File management will be implemented here.
      </Typography>
    </Box>
  );
};

export default FilesPage;
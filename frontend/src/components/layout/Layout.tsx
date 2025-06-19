import React, { useState, type ReactNode } from 'react';
import { Box, Toolbar } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import UploadQueueContainer from './UploadQueue';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <Header onMenuToggle={handleDrawerToggle} mobileOpen={mobileOpen} />

      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerClose} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'grey.50',
          minHeight: '100vh',
          ml: { md: '280px' },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
      <UploadQueueContainer/>
    </Box>
  );
};

export default Layout;

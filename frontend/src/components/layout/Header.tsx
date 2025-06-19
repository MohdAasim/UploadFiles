import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  CloudUpload,
  Notifications,
  Logout,
  Settings,
  Person,
  People,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';
import type { OnlineUser } from '../../types';

interface HeaderProps {
  onMenuToggle: () => void;
  mobileOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineUsersAnchorEl, setOnlineUsersAnchorEl] = useState<null | HTMLElement>(null);

  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Set up socket listeners for online users
  useEffect(() => {
    // Debug socket connection
    console.log('Header mounted, socket connected:', socketService.connected);
    
    // Handle online users updates
    const handleOnlineUsersUpdated = (users: OnlineUser[]) => {
      console.log('Online users updated in Header:', users.length);
      setOnlineUsers(users || []);
    };

    // Register listener for online users
    socketService.on('onlineUsersUpdated', handleOnlineUsersUpdated);
    
    // Request current online users if connected
    if (socketService.connected) {
      console.log('Socket connected, requesting online users from Header');
      socketService.getOnlineUsers();
    } else {
      console.log('Socket not connected in Header, will wait for connection');
      // We'll rely on the socketService's 'connected' event to trigger getOnlineUsers
    }

    // Periodically check if we need to request online users
    const interval = setInterval(() => {
      if (socketService.connected) {
        socketService.getOnlineUsers();
      }
    }, 30000); // Check every 30 seconds

    // Clean up listener when component unmounts
    return () => {
      socketService.off('onlineUsersUpdated', handleOnlineUsersUpdated);
      clearInterval(interval);
    };
  }, []);

  // Add a second useEffect for reconnection attempts
  useEffect(() => {
    // Try to get online users whenever the component re-renders
    // and the socket is connected but we have no users
    if (socketService.connected && onlineUsers.length === 0) {
      socketService.getOnlineUsers();
    }
  }, [onlineUsers.length]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const handleOnlineUsersClick = (event: React.MouseEvent<HTMLElement>) => {
    setOnlineUsersAnchorEl(event.currentTarget);
  };

  const handleOnlineUsersClose = () => {
    setOnlineUsersAnchorEl(null);
  };

  const isMenuOpen = Boolean(anchorEl);
  const isOnlineUsersMenuOpen = Boolean(onlineUsersAnchorEl);

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          {/* Menu Button for Mobile */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onMenuToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <CloudUpload
              sx={{
                fontSize: 32,
                color: 'primary.main',
                mr: 1,
              }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              UploadFiles
            </Typography>
          </Box>

          {/* Online Users Indicator */}
          <Tooltip title="Online users">
            <Chip
              icon={<People sx={{ color: theme.palette.primary.main }} />}
              label={`Online: ${onlineUsers.length}`}
              size="small"
              color="default"
              variant="outlined"
              onClick={handleOnlineUsersClick}
              sx={{ 
                mr: 2, 
                borderColor: 'primary.main',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.04)' },
                '& .MuiChip-label': { 
                  color: 'primary.main',
                  fontWeight: 'medium'
                }
              }}
            />
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              sx={{ mr: 1 }}
              onClick={() => console.log('Notifications clicked')}
            >
              <Badge badgeContent={notificationCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Tooltip title="Account settings">
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Online Users Menu */}
      <Menu
        anchorEl={onlineUsersAnchorEl}
        open={isOnlineUsersMenuOpen}
        onClose={handleOnlineUsersClose}
        sx={{ mt: 1 }}
        PaperProps={{
          style: { maxHeight: 300, width: 250 }
        }}
      >
        <Typography sx={{ px: 2, py: 1, fontWeight: 600 }}>
          Online Users ({onlineUsers.length})
        </Typography>
        
        <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
          {onlineUsers.length === 0 ? (
            <MenuItem disabled>No users online</MenuItem>
          ) : (
            onlineUsers.map((onlineUser) => (
              <MenuItem key={onlineUser.id} sx={{ py: 1 }}>
                <Avatar 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    mr: 1, 
                    bgcolor: 'primary.main',
                    fontSize: '0.75rem'
                  }}
                >
                  {onlineUser.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="body2">{onlineUser.name}</Typography>
              </MenuItem>
            ))
          )}
        </Box>
      </Menu>

      {/* User Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        id="primary-search-account-menu"
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={isMenuOpen}
        onClose={handleMenuClose}
        sx={{ mt: 1 }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>

        <MenuItem onClick={handleMenuClose}>
          <Person sx={{ mr: 2 }} />
          Profile
        </MenuItem>

        <MenuItem onClick={handleMenuClose}>
          <Settings sx={{ mr: 2 }} />
          Settings
        </MenuItem>

        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 2 }} />
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default Header;

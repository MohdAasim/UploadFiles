import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  CloudUpload,
  Folder,
  Share,
  People,
  Storage,
  Settings,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
  divider?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    text: 'My Files',
    icon: <CloudUpload />,
    path: '/files',
  },
  {
    text: 'Folders',
    icon: <Folder />,
    path: '/folders',
  },
  {
    text: 'Shared with Me',
    icon: <Share />,
    path: '/shared',
    badge: 0,
  },
  {
    text: 'Team',
    icon: <People />,
    path: '/team',
    divider: true,
  },
  {
    text: 'Storage',
    icon: <Storage />,
    path: '/storage',
  },
  {
    text: 'Settings',
    icon: <Settings />,
    path: '/settings',
  },
];

const drawerWidth = 280;

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onMobileClose();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Header */}
      <Box sx={{ p: 2, pt: 3 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: 'text.secondary' }}
        >
          File Manager
        </Typography>
      </Box>

      <Divider />

      {/* Navigation List */}
      <List sx={{ flexGrow: 1, px: 1 }}>
        {navigationItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color:
                      location.pathname === item.path
                        ? 'inherit'
                        : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      backgroundColor:
                        location.pathname === item.path
                          ? 'rgba(255,255,255,0.2)'
                          : 'primary.main',
                      color: 'white',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            {item.divider && <Divider sx={{ my: 1 }} />}
          </React.Fragment>
        ))}
      </List>

      {/* Storage Info */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Storage Used
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              flexGrow: 1,
              height: 8,
              backgroundColor: 'grey.200',
              borderRadius: 4,
              overflow: 'hidden',
              mr: 1,
            }}
          >
            <Box
              sx={{
                width: '0%',
                height: '100%',
                backgroundColor: 'primary.main',
              }}
            />
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          0 GB of 10 GB used
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;

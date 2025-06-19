import React from 'react';
import {
  Box,
  Avatar,
  AvatarGroup,
  Tooltip,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useViewing } from '../../contexts/ViewingContext';
import type { ViewerInfo } from '../../types/viewing';

interface FileViewersIndicatorProps {
  fileId: string;
  variant?: 'compact' | 'full';
  showCount?: boolean;
  maxVisible?: number;
}

const FileViewersIndicator: React.FC<FileViewersIndicatorProps> = ({
  fileId,
  variant = 'compact',
  showCount = true,
  maxVisible = 3,
}) => {
  const { getFileViewers, getCurrentViewersCount, isCurrentlyViewing } =
    useViewing();

  const viewers = getFileViewers(fileId);
  const viewersCount = getCurrentViewersCount(fileId);
  const isViewing = isCurrentlyViewing(fileId);

  if (viewersCount === 0 && !isViewing) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getViewerTooltip = (viewer: ViewerInfo) => {
    const joinedTime = new Date(viewer.joinedAt).toLocaleTimeString();
    return `${viewer.name} (${viewer.email}) - viewing since ${joinedTime}`;
  };

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {viewersCount > 0 && (
          <>
            <AvatarGroup
              max={maxVisible}
              sx={{
                '& .MuiAvatar-root': {
                  width: 24,
                  height: 24,
                  fontSize: '0.75rem',
                },
              }}
            >
              {viewers.map((viewer) => (
                <Tooltip key={viewer.id} title={getViewerTooltip(viewer)} arrow>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 24,
                      height: 24,
                      fontSize: '0.75rem',
                      border: '2px solid white',
                    }}
                    src={viewer.avatar}
                  >
                    {!viewer.avatar && getInitials(viewer.name)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
            {showCount && (
              <Chip
                icon={<Visibility />}
                label={viewersCount}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </>
        )}
        {isViewing && (
          <Chip
            icon={<Visibility />}
            label="You"
            size="small"
            color="success"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        )}
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Visibility color="primary" />
        <Typography variant="subtitle2" color="primary">
          Currently Viewing ({viewersCount})
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', gap: 1 }}>
        <AvatarGroup max={maxVisible}>
          {viewers.map((viewer) => (
            <Tooltip key={viewer.id} title={getViewerTooltip(viewer)} arrow>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 32,
                  height: 32,
                  border: '2px solid white',
                }}
                src={viewer.avatar}
              >
                {!viewer.avatar && getInitials(viewer.name)}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>

        <Box sx={{ ml: 1 }}>
          {viewers.slice(0, 2).map((viewer) => (
            <Typography key={viewer.id} variant="caption" display="block">
              {viewer.name}
            </Typography>
          ))}
          {viewers.length > 2 && (
            <Typography variant="caption" color="text.secondary">
              +{viewers.length - 2} more
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default FileViewersIndicator;

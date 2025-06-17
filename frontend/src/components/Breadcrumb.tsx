import React from 'react';
import { Breadcrumbs, Typography, Link, Box, IconButton } from '@mui/material';
import { Home, NavigateNext, ArrowBack } from '@mui/icons-material';
import { useFolders } from '../hooks/useFiles';

interface BreadcrumbProps {
  currentFolder?: string;
  onFolderClick: (folderId?: string) => void;
}

interface BreadcrumbItem {
  id?: string;
  name: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  currentFolder,
  onFolderClick,
}) => {
  const { data: folders } = useFolders();

  const buildBreadcrumbPath = (folderId?: string): BreadcrumbItem[] => {
    if (!folderId || !folders) return [{ name: 'Home' }];

    const path: BreadcrumbItem[] = [{ name: 'Home' }];
    let current = folders.find((f) => f._id === folderId);

    const visited = new Set<string>();
    while (current && !visited.has(current._id)) {
      visited.add(current._id);
      path.unshift({ id: current._id, name: current.name });

      // Store the parent ID and find the parent folder
      const parentId = current.parent;
      if (parentId) {
        current = folders.find((f) => f._id === parentId);
        // If parent folder is not found, break the loop
        if (!current) {
          break;
        }
      } else {
        break;
      }
    }

    return path;
  };

  const breadcrumbPath = buildBreadcrumbPath(currentFolder);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 2,
        p: 1,
        bgcolor: 'grey.50',
        borderRadius: 1,
      }}
    >
      {/* Back Button */}
      {currentFolder && (
        <IconButton
          onClick={() => onFolderClick(undefined)}
          size="small"
          sx={{ mr: 1 }}
          title="Back to root"
        >
          <ArrowBack />
        </IconButton>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
        {breadcrumbPath.map((item, index) => {
          const isLast = index === breadcrumbPath.length - 1;

          if (isLast) {
            return (
              <Typography
                key={item.id || 'home'}
                color="text.primary"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {index === 0 && <Home sx={{ mr: 0.5, fontSize: '1rem' }} />}
                {item.name}
              </Typography>
            );
          }

          return (
            <Link
              key={item.id || 'home'}
              component="button"
              variant="body2"
              onClick={() => onFolderClick(item.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {index === 0 && <Home sx={{ mr: 0.5, fontSize: '1rem' }} />}
              {item.name}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default Breadcrumb;

import React from 'react';
import {
  Breadcrumbs,
  Typography,
  Link,
  Box,
} from '@mui/material';
import { Home, NavigateNext } from '@mui/icons-material';
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
    if (!folderId || !folders) return [{ name: "Home" }];

    const path: BreadcrumbItem[] = [{ name: "Home" }];
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
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
        {breadcrumbPath.map((item, index) => {
          const isLast = index === breadcrumbPath.length - 1;

          if (isLast) {
            return (
              <Typography
                key={item.id || "home"}
                color="text.primary"
                sx={{ display: "flex", alignItems: "center" }}
              >
                {index === 0 && <Home sx={{ mr: 0.5, fontSize: "1rem" }} />}
                {item.name}
              </Typography>
            );
          }

          return (
            <Link
              key={item.id || "home"}
              component="button"
              variant="body1"
              onClick={() => onFolderClick(item.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                textDecoration: "none",
                border: "none",
                background: "none",
                padding: 0,
                font: "inherit",
                color: "primary.main",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              {index === 0 && <Home sx={{ mr: 0.5, fontSize: "1rem" }} />}
              {item.name}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default Breadcrumb;
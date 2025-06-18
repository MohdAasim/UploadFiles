import React from 'react';
import { Typography } from '@mui/material';

interface DashboardHeaderProps {
  userName?: string;
  currentFolder?: string;
  fileCount: number;
  folderCount: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  currentFolder,
  fileCount,
  folderCount,
}) => {
  return (
    <div className="mb-8">
      <Typography variant="h4" component="h1" className="mb-2">
        Welcome back, {userName}! 👋
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {currentFolder ? (
          <>
            Browsing folder • {fileCount} files, {folderCount} folders
          </>
        ) : (
          <>
            Root directory • {fileCount} files, {folderCount} folders
          </>
        )}
      </Typography>
    </div>
  );
};

export default DashboardHeader;

import React from 'react';
import { Button } from '@mui/material';
import { CloudUpload, CloudQueue, Folder } from '@mui/icons-material';

interface ActionButtonsProps {
  onUploadClick: () => void;
  onBulkUploadClick: () => void;
  onCreateFolderClick: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onUploadClick,
  onBulkUploadClick,
  onCreateFolderClick,
}) => {
  return (
    <div className="flex gap-4 mb-6">
      <Button
        variant="contained"
        startIcon={<CloudUpload />}
        onClick={onUploadClick}
      >
        Upload Files
      </Button>
      <Button
        variant="outlined"
        startIcon={<CloudQueue />}
        onClick={onBulkUploadClick}
      >
        Bulk Upload
      </Button>
      <Button
        variant="outlined"
        startIcon={<Folder />}
        onClick={onCreateFolderClick}
      >
        New Folder
      </Button>
    </div>
  );
};

export default ActionButtons;
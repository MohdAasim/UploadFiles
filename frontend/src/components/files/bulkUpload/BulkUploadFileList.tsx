import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  LinearProgress,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { Close, FolderOpen } from '@mui/icons-material';
import type { FileWithPath } from '../BulkUpload';
import {
  getStatusIcon,
  getStatusColor,
  getProgressColor,
} from '../../../utils/bulkUploadHelpers';

interface BulkUploadFileListProps {
  groupedFiles: Record<string, FileWithPath[]>;
  removeFile: (id: string) => void;
  uploading: boolean;
  icons: { [key: string]: React.ReactElement };
}

const BulkUploadFileList: React.FC<BulkUploadFileListProps> = ({
  groupedFiles,
  removeFile,
  uploading,
  icons,
}) => (
  <Paper className="mt-2 max-h-[400px] overflow-auto">
    <List>
      {Object.entries(groupedFiles).map(([folderName, folderFiles]) => (
        <React.Fragment key={folderName}>
          <ListItem className="bg-gray-100">
            <FolderOpen className="mr-1" />
            <Typography variant="subtitle2" className="font-semibold">
              {folderName} ({folderFiles.length} files)
            </Typography>
          </ListItem>
          {folderFiles.map((fileWithPath) => (
            <ListItem key={fileWithPath.id} divider className="pl-8">
              <Box className="mr-2">
                {getStatusIcon(fileWithPath.status, icons)}
              </Box>
              <ListItemText
                primary={
                  <Box className="flex items-center gap-1">
                    <Typography variant="body2" noWrap>
                      {fileWithPath.relativePath.split('/').pop()}
                    </Typography>
                    <Chip
                      label={fileWithPath.status}
                      size="small"
                      color={getStatusColor(fileWithPath.status)}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    {fileWithPath.status === 'uploading' && (
                      <LinearProgress
                        variant="determinate"
                        value={fileWithPath.progress}
                        color={getProgressColor(fileWithPath.status)}
                        className="mt-1 mb-1"
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {fileWithPath.error ? (
                        <span className="text-red-600">
                          Error: {fileWithPath.error}
                        </span>
                      ) : (
                        `${(fileWithPath.file.size / 1024 / 1024).toFixed(2)} MB • ${fileWithPath.relativePath}`
                      )}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  size="small"
                  onClick={() => removeFile(fileWithPath.id)}
                  disabled={uploading}
                >
                  <Close />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </React.Fragment>
      ))}
    </List>
  </Paper>
);

export default BulkUploadFileList;

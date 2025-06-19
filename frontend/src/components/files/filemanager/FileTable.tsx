import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Checkbox, Box, Avatar, Typography, Chip, IconButton
} from '@mui/material';
import { Folder, MoreVert } from '@mui/icons-material';
import FileViewersIndicator from '../FileViewersIndicator';
import type { FileType, FolderType } from '../../../types';

interface FileWithType extends FileType { type: 'file'; }
interface FolderWithType extends FolderType { type: 'folder'; }
type ItemWithType = FileWithType | FolderWithType;

interface FileTableProps {
  allItems: ItemWithType[];
  selectedItems: string[];
  selectionMode: boolean;
  onItemSelect: (id: string) => void;
  onRowClick: (id: string) => void;
  onRowDoubleClick: (item: ItemWithType) => void;
  onMenuOpen: (e: React.MouseEvent<HTMLElement>, item: ItemWithType) => void;
  getFileIcon: (mimetype: string) => string;
  formatFileSize: (bytes: number) => string;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
}

const FileTable: React.FC<FileTableProps> = ({
  allItems,
  selectedItems,
  selectionMode,
  onItemSelect,
  onRowClick,
  onRowDoubleClick,
  onMenuOpen,
  getFileIcon,
  formatFileSize,
  isAllSelected,
  isIndeterminate,
  onSelectAll,
}) => (
  <TableContainer component={Paper} elevation={0} variant="outlined">
    <Table>
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={isIndeterminate}
              checked={isAllSelected}
              onChange={onSelectAll}
            />
          </TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Size</TableCell>
          <TableCell>Modified</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {allItems.map((item) => {
          const isSelected = selectedItems.includes(item._id);
          return (
            <TableRow
              key={`${item.type}-${item._id}`}
              hover
              selected={isSelected}
              sx={{
                cursor: item.type === 'folder' ? 'pointer' : 'default',
                '&:hover': { backgroundColor: 'action.hover' },
              }}
              onClick={() => {
                if (!selectionMode) onRowClick(item._id);
                else onItemSelect(item._id);
              }}
              onDoubleClick={() => onRowDoubleClick(item)}
            >
              <TableCell padding="checkbox">
                <Checkbox
                  checked={isSelected}
                  onChange={() => onItemSelect(item._id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      mr: 2,
                      bgcolor: item.type === 'folder' ? 'primary.main' : 'grey.100',
                      width: 40,
                      height: 40,
                    }}
                  >
                    {item.type === 'folder' ? (
                      <Folder />
                    ) : (
                      <span style={{ fontSize: '1.2rem' }}>
                        {getFileIcon((item as FileWithType).mimetype)}
                      </span>
                    )}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">
                      {item.type === 'file'
                        ? (item as FileWithType).originalName
                        : (item as FolderWithType).name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        {item.type === 'file' ? 'File' : 'Folder'}
                      </Typography>
                      {item.type === 'file' && (
                        <FileViewersIndicator fileId={item._id} variant="compact" maxVisible={2} />
                      )}
                    </Box>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={item.type === 'file' ? 'File' : 'Folder'}
                  size="small"
                  color={item.type === 'file' ? 'primary' : 'secondary'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {item.type === 'file'
                  ? formatFileSize((item as FileWithType).size)
                  : '-'}
              </TableCell>
              <TableCell>
                {item.createdAt}
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={(e) => onMenuOpen(e, item)}>
                  <MoreVert />
                </IconButton>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

export default FileTable;
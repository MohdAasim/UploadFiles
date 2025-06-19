import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Visibility, History, Folder, Share, Download, Delete } from '@mui/icons-material';
import type { ItemWithType } from '../../../hooks/useFileManagerLogic';


interface FileContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  selectedItem: ItemWithType | null;
  onClose: () => void;
  onPreview: () => void;
  onVersionHistory: () => void;
  onOpenFolder: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const FileContextMenu: React.FC<FileContextMenuProps> = ({
  anchorEl,
  open,
  selectedItem,
  onClose,
  onPreview,
  onVersionHistory,
  onOpenFolder,
  onShare,
  onDownload,
  onDelete,
}) => (
  <Menu
    anchorEl={anchorEl}
    open={open}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
  >
    {selectedItem?.type === 'file' && (
      <MenuItem onClick={onPreview}>
        <ListItemIcon>
          <Visibility fontSize="small" />
        </ListItemIcon>
        <ListItemText>Preview</ListItemText>
      </MenuItem>
    )}
    {selectedItem?.type === 'file' && (
      <MenuItem onClick={onVersionHistory}>
        <ListItemIcon>
          <History fontSize="small" />
        </ListItemIcon>
        <ListItemText>Version History</ListItemText>
      </MenuItem>
    )}
    {selectedItem?.type === 'folder' && (
      <MenuItem onClick={onOpenFolder}>
        <ListItemIcon>
          <Folder fontSize="small" />
        </ListItemIcon>
        <ListItemText>Open Folder</ListItemText>
      </MenuItem>
    )}
    <MenuItem onClick={onShare}>
      <ListItemIcon>
        <Share fontSize="small" />
      </ListItemIcon>
      <ListItemText>Share</ListItemText>
    </MenuItem>
    {selectedItem?.type === 'file' && (
      <MenuItem onClick={onDownload}>
        <ListItemIcon>
          <Download fontSize="small" />
        </ListItemIcon>
        <ListItemText>Download</ListItemText>
      </MenuItem>
    )}
    <MenuItem onClick={onDelete} sx={{ color: 'error.main' }}>
      <ListItemIcon>
        <Delete fontSize="small" color="error" />
      </ListItemIcon>
      <ListItemText>Delete</ListItemText>
    </MenuItem>
  </Menu>
);

export default FileContextMenu;
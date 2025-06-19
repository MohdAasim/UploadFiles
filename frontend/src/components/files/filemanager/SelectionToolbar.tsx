import React from 'react';
import { Toolbar, Checkbox, Button, Chip } from '@mui/material';
import { SelectAll, Download, Delete, Clear } from '@mui/icons-material';

interface SelectionToolbarProps {
  isAllSelected: boolean;
  isIndeterminate: boolean;
  selectedCount: number;
  onSelectAll: () => void;
  onBulkDownload: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  isAllSelected,
  isIndeterminate,
  selectedCount,
  onSelectAll,
  onBulkDownload,
  onBulkDelete,
  onClearSelection,
}) => (
  <Toolbar sx={{ minHeight: '48px !important', px: '0 !important', mb: 1 }}>
    <Checkbox
      indeterminate={isIndeterminate}
      checked={isAllSelected}
      onChange={onSelectAll}
      sx={{ mr: 1 }}
    />
    <Button
      size="small"
      variant="text"
      startIcon={<SelectAll />}
      onClick={onSelectAll}
      sx={{ mr: 2 }}
    >
      {isAllSelected ? 'Deselect All' : 'Select All'}
    </Button>
    {selectedCount > 0 && (
      <>
        <Chip
          label={`${selectedCount} selected`}
          size="small"
          color="primary"
          sx={{ mr: 2 }}
        />
        <Button
          size="small"
          variant="outlined"
          color="primary"
          startIcon={<Download />}
          onClick={onBulkDownload}
          sx={{ mr: 1 }}
        >
          Download
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={onBulkDelete}
          sx={{ mr: 1 }}
        >
          Delete
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Clear />}
          onClick={onClearSelection}
        >
          Clear
        </Button>
      </>
    )}
  </Toolbar>
);

export default SelectionToolbar;
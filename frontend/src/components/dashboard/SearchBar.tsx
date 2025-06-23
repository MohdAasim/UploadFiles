/* eslint-disable */
// /home/arslaanas/Desktop/UploadFiles/frontend/src/components/dashboard/SearchBar.tsx
import React, { useState } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Alert,
  Chip,
  Button,
  Box,
  Collapse,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Search,
  Clear,
  FilterList,
  CalendarMonth,
  FilePresent,
  Label,
  SortByAlpha,
  Storage,
  ContentPaste,
  Settings,
} from '@mui/icons-material';
import type { searchResultsType, SearchFilters } from '../../types';

interface SearchBarProps {
  searchQuery: string;
  debouncedQuery: string;
  searchLoading: boolean;
  searchError: Error | null;
  searchResults: searchResultsType;
  filters: SearchFilters;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onFilterChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  debouncedQuery,
  searchLoading,
  searchError,
  searchResults,
  filters,
  onSearchChange,
  onClearSearch,
  onFilterChange,
  onClearFilters,
}) => {
  console.log({ searchResults });

  const theme = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const showSearchResults = debouncedQuery.length >= 2;
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== '' && value !== false
  );

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== '' && value !== false
  ).length;

  const handleFilterToggle = () => {
    setShowFilters((prev) => !prev);
  };

  const handleFilterChange = (name: string, value: any) => {
    onFilterChange({ ...filters, [name]: value });
  };

  const handleOpenFilterDialog = () => {
    setFilterDialogOpen(true);
  };

  const handleCloseFilterDialog = () => {
    setFilterDialogOpen(false);
  };

  const renderActiveFilters = () => {
    if (!hasActiveFilters) return null;

    return (
      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {filters.fileType && (
          <Chip
            size="small"
            icon={<FilePresent fontSize="small" />}
            label={`Type: ${filters.fileType}`}
            onDelete={() => handleFilterChange('fileType', '')}
            color="primary"
            variant="outlined"
          />
        )}
        {filters.dateFrom && (
          <Chip
            size="small"
            icon={<CalendarMonth fontSize="small" />}
            label={`From: ${new Date(filters.dateFrom).toLocaleDateString()}`}
            onDelete={() => handleFilterChange('dateFrom', '')}
            color="primary"
            variant="outlined"
          />
        )}
        {filters.dateTo && (
          <Chip
            size="small"
            icon={<CalendarMonth fontSize="small" />}
            label={`To: ${new Date(filters.dateTo).toLocaleDateString()}`}
            onDelete={() => handleFilterChange('dateTo', '')}
            color="primary"
            variant="outlined"
          />
        )}
        {filters.minSize && (
          <Chip
            size="small"
            icon={<Storage fontSize="small" />}
            label={`Min: ${filters.minSize}MB`}
            onDelete={() => handleFilterChange('minSize', '')}
            color="primary"
            variant="outlined"
          />
        )}
        {filters.maxSize && (
          <Chip
            size="small"
            icon={<Storage fontSize="small" />}
            label={`Max: ${filters.maxSize}MB`}
            onDelete={() => handleFilterChange('maxSize', '')}
            color="primary"
            variant="outlined"
          />
        )}
        {filters.tags && (
          <Chip
            size="small"
            icon={<Label fontSize="small" />}
            label={`Tags: ${filters.tags}`}
            onDelete={() => handleFilterChange('tags', '')}
            color="primary"
            variant="outlined"
          />
        )}
        {filters.searchContent && (
          <Chip
            size="small"
            icon={<ContentPaste fontSize="small" />}
            label="Content search enabled"
            onDelete={() => handleFilterChange('searchContent', false)}
            color="primary"
            variant="outlined"
          />
        )}
        <Button
          size="small"
          variant="text"
          onClick={onClearFilters}
          sx={{ ml: 'auto' }}
        >
          Clear all filters
        </Button>
      </Box>
    );
  };

  return (
    <div className="mb-6">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          placeholder="Search files and folders by name..."
          value={searchQuery}
          onChange={onSearchChange}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={onClearSearch}
                  title="Clear search"
                >
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
        <Tooltip title="Advanced search filters">
          <Badge badgeContent={activeFilterCount} color="primary">
            <Button
              variant={hasActiveFilters ? 'contained' : 'outlined'}
              size="small"
              startIcon={<FilterList />}
              onClick={handleOpenFilterDialog}
              sx={{ borderRadius: 2, minWidth: '120px' }}
            >
              Filters
            </Button>
          </Badge>
        </Tooltip>
      </Box>

      {renderActiveFilters()}

      {/* Search Status Indicators */}
      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <Typography
          variant="caption"
          color="text.secondary"
          className="mt-2 block"
        >
          Type at least 2 characters to search
        </Typography>
      )}

      {searchQuery.length >= 2 && debouncedQuery !== searchQuery && (
        <Typography
          variant="caption"
          color="warning.main"
          className="mt-2 block"
        >
          ⏳ Search will start in a moment...
        </Typography>
      )}

      {searchLoading && (
        <Typography
          variant="caption"
          color="primary.main"
          className="mt-2 block"
        >
          🔍 Searching for "{debouncedQuery}"...
          {hasActiveFilters && ' (with filters)'}
        </Typography>
      )}

      {/* Search Results */}
      {showSearchResults && (
        <div className="mb-6">
          {searchError && (
            <Alert severity="error" className="mb-4">
              Search failed: {searchError.message}
            </Alert>
          )}

          {searchResults && !searchLoading && (
            <div className="mb-4">
              <Box className="flex items-center gap-4 mb-4">
                <Typography variant="h6">
                  Search Results for "{debouncedQuery}"
                  {hasActiveFilters && ' (Filtered)'}
                </Typography>
                <Chip
                  label={`${
                    (searchResults?.data?.files?.length || 0) +
                    (searchResults?.data?.folders?.length || 0)
                  } items found`}
                  size="small"
                  color="primary"
                />
                <Button size="small" onClick={onClearSearch} variant="outlined">
                  Clear Search
                </Button>
              </Box>
            </div>
          )}
        </div>
      )}

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={handleCloseFilterDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            Advanced Search Filters
          </Box>
          {hasActiveFilters && (
            <Button size="small" color="error" onClick={onClearFilters}>
              Clear All Filters
            </Button>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
            {/* File Type Filter */}
            <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>File Type</InputLabel>
                <Select
                  value={filters.fileType || ''}
                  label="File Type"
                  onChange={(e) =>
                    handleFilterChange('fileType', e.target.value)
                  }
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="image">Images</MenuItem>
                  <MenuItem value="document">Documents</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="video">Videos</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Date Range */}
            <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1.5 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ display: 'flex', mx: -1 }}>
                  <Box sx={{ width: '50%', px: 1 }}>
                    <DatePicker
                      label="From Date"
                      value={
                        filters.dateFrom ? new Date(filters.dateFrom) : null
                      }
                      onChange={(date) =>
                        handleFilterChange('dateFrom', date?.toISOString())
                      }
                      slotProps={{
                        textField: { size: 'small', fullWidth: true },
                      }}
                    />
                  </Box>
                  <Box sx={{ width: '50%', px: 1 }}>
                    <DatePicker
                      label="To Date"
                      value={filters.dateTo ? new Date(filters.dateTo) : null}
                      onChange={(date) =>
                        handleFilterChange('dateTo', date?.toISOString())
                      }
                      slotProps={{
                        textField: { size: 'small', fullWidth: true },
                      }}
                    />
                  </Box>
                </Box>
              </LocalizationProvider>
            </Box>

            {/* Size Range */}
            <Box sx={{ width: '100%', p: 1.5 }}>
              <Typography variant="subtitle2" gutterBottom>
                File Size Range (MB)
              </Typography>
              <Box sx={{ display: 'flex', mx: -1 }}>
                <Box sx={{ width: '50%', px: 1 }}>
                  <TextField
                    label="Min Size (MB)"
                    type="number"
                    value={filters.minSize || ''}
                    onChange={(e) =>
                      handleFilterChange('minSize', e.target.value)
                    }
                    size="small"
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Box>
                <Box sx={{ width: '50%', px: 1 }}>
                  <TextField
                    label="Max Size (MB)"
                    type="number"
                    value={filters.maxSize || ''}
                    onChange={(e) =>
                      handleFilterChange('maxSize', e.target.value)
                    }
                    size="small"
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Content Search Switch */}
            <Box sx={{ width: '100%', p: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.searchContent || false}
                    onChange={(e) =>
                      handleFilterChange('searchContent', e.target.checked)
                    }
                    color="primary"
                  />
                }
                label={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <ContentPaste fontSize="small" />
                    <Typography>
                      Search within file contents (may be slower)
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFilterDialog} color="primary">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SearchBar;

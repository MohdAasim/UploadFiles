/* eslint-disable */
import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Alert,
  Chip,
  Button,
  Box,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import type { searchResultsType } from '../../types';

interface SearchBarProps {
  searchQuery: string;
  debouncedQuery: string;
  searchLoading: boolean;
  searchError: Error | null;
  searchResults: searchResultsType;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  debouncedQuery,
  searchLoading,
  searchError,
  searchResults,
  onSearchChange,
  onClearSearch,
}) => {
  const showSearchResults = debouncedQuery.length >= 2;

  return (
    <div className="mb-6">
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
                </Typography>
                <Chip
                  label={`${
                    ((searchResults as any).files?.length || 0) +
                    ((searchResults as any).folders?.length || 0)
                  } items found`}
                  size="small"
                  color="primary"
                />
                <Button
                  size="small"
                  onClick={onClearSearch}
                  variant="outlined"
                >
                  Clear Search
                </Button>
              </Box>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
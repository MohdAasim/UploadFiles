import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useSearch } from '../../hooks/useSearch';
import { useNavigate } from 'react-router-dom';

interface HeaderSearchProps {
  compact?: boolean;
}

const HeaderSearch: React.FC<HeaderSearchProps> = ({ compact = false }) => {
  const { query, updateQuery, clearSearch } = useSearch();

  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateQuery(event.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClear = () => {
    clearSearch();
    inputRef.current?.focus();
  };

  const handleSearchSubmit = (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    if (queryToSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(queryToSearch)}`);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  if (compact) {
    return (
      <Tooltip title="Search files and folders">
        <IconButton
          color="inherit"
          onClick={() => navigate('/search')}
          sx={{ mr: 1 }}
        >
          <Search />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: { xs: '100%', sm: 400 } }}>
      <TextField
        ref={inputRef}
        fullWidth
        placeholder="Search files and folders..."
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
        variant="outlined"
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
            },
            '&.Mui-focused': {
              backgroundColor: 'background.paper',
              color: 'text.primary',
            },
            '& input': {
              color: isFocused ? 'text.primary' : 'inherit',
              '&::placeholder': {
                color: isFocused
                  ? 'text.secondary'
                  : 'rgba(255, 255, 255, 0.7)',
              },
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color={isFocused ? 'action' : 'inherit'} />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                title="Clear search"
              >
                <Clear />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default HeaderSearch;

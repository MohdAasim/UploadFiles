import { useQuery } from '@tanstack/react-query';
import { searchAPI } from '../services/api';
import { useState, useCallback, useMemo } from 'react';
import type { SearchFilters } from '../types';

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(
    undefined
  );
  const [filters, setFilters] = useState<SearchFilters>({
    fileType: '',
    dateFrom: '',
    dateTo: '',
    minSize: '',
    maxSize: '',
    tags: '',
    owner: '',
    searchContent: false,
    sortBy: 'name',
  });

  // Memoize search params to prevent unnecessary re-renders
  const searchParams = useMemo(
    () => ({
      q: query,
      inFolder: currentFolder,
      kind: 'all' as const,
      ...filters,
    }),
    [query, currentFolder, filters]
  );

  // Advanced search query with filters
  const searchResults = useQuery({
    queryKey: ['search', searchParams],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) {
        return null;
      }

      console.log('Frontend: Searching with params:', searchParams);

      const response = await searchAPI.search(searchParams);

      console.log('Frontend: Search response:', response.data);
      return response.data;
    },
    enabled: query.length >= 2,
    staleTime: 10000,
    gcTime: 300000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  const updateCurrentFolder = useCallback((folderId?: string) => {
    setCurrentFolder(folderId);
  }, []);

  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      fileType: '',
      dateFrom: '',
      dateTo: '',
      minSize: '',
      maxSize: '',
      tags: '',
      owner: '',
      searchContent: false,
      sortBy: 'name',
    });
  }, []);

  return {
    query,
    filters,
    searchResults: searchResults.data || null,
    isLoading: searchResults.isLoading,
    error: searchResults.error,
    updateQuery,
    clearSearch,
    updateCurrentFolder,
    updateFilters,
    clearFilters,
  };
};

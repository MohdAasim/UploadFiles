import { useQuery } from "@tanstack/react-query";
import { searchAPI } from "../services/api";
import { useState, useCallback, useMemo } from "react";

// interface SearchFilters {
//   type?: string;
//   inFolder?: string;
//   kind?: 'file' | 'folder' | 'all';
// }

export const useSearch = () => {
  const [query, setQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);

  // Memoize search params to prevent unnecessary re-renders
  const searchParams = useMemo(() => ({
    q: query,
    inFolder: currentFolder,
    kind: 'all' as const
  }), [query, currentFolder]);

  // Basic search query with better caching
  const searchResults = useQuery({
    queryKey: ["search", searchParams],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) {
        return null;
      }
      
      console.log('Frontend: Searching for:', query);
      
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
    setQuery("");
  }, []);

  const updateCurrentFolder = useCallback((folderId?: string) => {
    setCurrentFolder(folderId);
  }, []);

  return {
    query,
    searchResults: searchResults.data || null,
    isLoading: searchResults.isLoading,
    error: searchResults.error,
    updateQuery,
    clearSearch,
    updateCurrentFolder,
  };
};
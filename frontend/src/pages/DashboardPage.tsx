/*eslint-disable*/
import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Tabs,
  Tab,
  Dialog,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Alert,} from "@mui/material";
import {
  CloudUpload,
  Folder,
  Share,
  Storage,
  FolderOpen,
  CloudQueue,
  Search,
  Clear,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useFolders, useFolderTree } from "../hooks/useFiles";
import { useSearch } from "../hooks/useSearch";
import { useDebounce } from "../hooks/useDebounce";
import FileManager from "../components/files/FileManager";
import FileUpload from "../components/files/FileUpload";
import BulkUpload from "../components/files/BulkUpload";
import CreateFolderDialog from "../components/dialogs/CreateFolderDialog";
import Breadcrumb from "../components/Breadcrumb";
import type { FileType, FolderType } from "../types";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
interface searchResultsType {
  data: { files: FileType[]; folders: FolderType[] };
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(
    undefined
  );
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);

  // Search state with longer debounce (3 seconds)
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Use the new hook that gets both files and folders for current directory
  const {
    data: folderTree,
    isLoading: treeLoading,
    error: treeError,
  } = useFolderTree(currentFolder);
  const { data: allFolders } = useFolders(); // All folders for stats

  // Search hook
  const {
    updateQuery,
    searchResults,
    isLoading: searchLoading,
    error: searchError,
    updateCurrentFolder,
  } = useSearch();

  // Update search when debounced query changes - with better dependency management
  React.useEffect(() => {
    if (debouncedQuery !== searchQuery) return; // Only update when debounce is complete
    console.log("Dashboard: Debounced query changed:", debouncedQuery);
    updateQuery(debouncedQuery);
  }, [debouncedQuery]); // Remove updateQuery from dependencies to prevent loops

  // Update current folder in search hook - with better dependency management
  React.useEffect(() => {
    updateCurrentFolder(currentFolder);
  }, [currentFolder]); // Remove updateCurrentFolder from dependencies

  const showSearchResults = debouncedQuery.length >= 2;

  // Memoize stats calculation with proper TypeScript typing
  const stats = useMemo(() => {
    const currentFiles = folderTree?.files || [];
    const currentFolders = folderTree?.folders || [];
    const totalFolders = allFolders || [];

    const fileCount = currentFiles.length;
    const folderCount = currentFolders.length;
    const totalFolderCount = totalFolders.length;
    const totalSize = currentFiles.reduce(
      (acc: number, f: FileType) => acc + (f.size || 0),
      0
    );
    const sizeInMB = totalSize / 1024 / 1024;

    return [
      {
        label: "Files (Current)",
        value: fileCount.toString(),
        icon: <CloudUpload />,
        color: "#1976d2",
      },
      {
        label: "Folders (Current)",
        value: folderCount.toString(),
        icon: <Folder />,
        color: "#2e7d32",
      },
      {
        label: "Total Folders",
        value: totalFolderCount.toString(),
        icon: <FolderOpen />,
        color: "#ed6c02",
      },
      {
        label: "Storage Used",
        value: sizeInMB > 0 ? `${sizeInMB.toFixed(1)} MB` : "0 MB",
        icon: <Storage />,
        color: "#9c27b0",
      },
    ];
  }, [folderTree, allFolders]);

  // Memoize event handlers
  const handleTabChange = React.useCallback(
    (_event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
    },
    []
  );

  const handleSearchChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      console.log("Dashboard: Search input changed:", value);
      setSearchQuery(value);
    },
    []
  );

  const handleClearSearch = React.useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleFolderClick = React.useCallback(
    (folderId?: string) => {
      setCurrentFolder(folderId);
      // Clear search when navigating to a folder
      if (searchQuery) {
        setSearchQuery("");
      }
    },
    [searchQuery]
  );

  // Define Speed Dial Actions
  const speedDialActions = useMemo(
    () => [
      {
        name: "Upload Files",
        icon: <CloudUpload />,
        onClick: () => setUploadDialogOpen(true),
      },
      {
        name: "Bulk Upload",
        icon: <CloudQueue />,
        onClick: () => setBulkUploadOpen(true),
      },
      {
        name: "New Folder",
        icon: <Folder />,
        onClick: () => setCreateFolderDialogOpen(true),
      },
      {
        name: "Share",
        icon: <Share />,
        onClick: () => {
          // Add share functionality here
          console.log("Share clicked");
        },
      },
    ],
    []
  );

  // Debug log with less frequency
  React.useEffect(() => {
    console.log("Dashboard render state:", {
      searchQuery,
      debouncedQuery,
      showSearchResults,
      hasSearchResults: !!searchResults,
      searchLoading,
      searchError: !!searchError,
    });
  }, [
    searchQuery,
    debouncedQuery,
    showSearchResults,
    searchResults,
    searchLoading,
    searchError,
  ]);

  return (
    <Box>
      {/* Header with current folder info */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {currentFolder ? (
            <>
              Browsing folder • {folderTree?.fileCount || 0} files,{" "}
              {folderTree?.folderCount || 0} folders
            </>
          ) : (
            <>
              Root directory • {folderTree?.fileCount || 0} files,{" "}
              {folderTree?.folderCount || 0} folders
            </>
          )}
        </Typography>
      </Box>

      {/* Stats Cards - Using Box instead of Grid */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          mb: 4,
        }}
      >
        {stats.map((stat, index) => (
          <Box
            key={index}
            sx={{
              flex: "1 1 300px",
              minWidth: "250px",
              maxWidth: "300px",
            }}
          >
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: `${stat.color}20`,
                      color: stat.color,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 600 }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* File Management Section */}
      <Paper sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Files & Folders" />
            <Tab label="Upload Files" />
            <Tab label="Bulk Upload" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            {/* Single Search Input */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search files and folders by name..."
                value={searchQuery}
                onChange={handleSearchChange}
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
                        onClick={handleClearSearch}
                        title="Clear search"
                      >
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />

              {/* Search Status Indicators */}
              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Type at least 2 characters to search
                </Typography>
              )}

              {searchQuery.length >= 2 && debouncedQuery !== searchQuery && (
                <Typography
                  variant="caption"
                  color="warning.main"
                  sx={{ mt: 1, display: "block" }}
                >
                  ⏳ Search will start in a moment...
                </Typography>
              )}

              {searchLoading && (
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ mt: 1, display: "block" }}
                >
                  🔍 Searching for "{debouncedQuery}"...
                </Typography>
              )}
            </Box>

            {/* Search Results or Error */}
            {showSearchResults && (
              <Box sx={{ mb: 3 }}>
                {searchError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Search failed: {searchError.message}
                  </Alert>
                )}

                {searchResults && !searchLoading && (
                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 2,
                      }}
                    >
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
                        onClick={handleClearSearch}
                        variant="outlined"
                      >
                        Clear Search
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Action Buttons - Show only when NOT searching */}
            {!showSearchResults && (
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Upload Files
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloudQueue />}
                  onClick={() => setBulkUploadOpen(true)}
                >
                  Bulk Upload
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Folder />}
                  onClick={() => setCreateFolderDialogOpen(true)}
                >
                  New Folder
                </Button>
              </Box>
            )}

            {/* Breadcrumb Navigation - Show only when NOT searching */}
            {!showSearchResults && (
              <Breadcrumb
                currentFolder={currentFolder}
                onFolderClick={handleFolderClick}
              />
            )}

            {/* File Manager - Pass search results when searching */}
            <FileManager
              currentFolder={currentFolder}
              onFolderClick={handleFolderClick}
              searchResults={
                showSearchResults ? (searchResults as searchResultsType) : null
              }
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <FileUpload
            parentFolder={currentFolder}
            onUploadComplete={() => setTabValue(0)}
            maxFileSize={100}
            maxFiles={20}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<CloudQueue />}
              onClick={() => setBulkUploadOpen(true)}
            >
              Open Bulk Upload
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Upload entire folders with their structure preserved.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload Files
          </Typography>
          <FileUpload
            parentFolder={currentFolder}
            onUploadComplete={() => {
              setUploadDialogOpen(false);
              setTabValue(0);
            }}
            maxFileSize={100}
            maxFiles={20}
          />
        </Box>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <BulkUpload
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        parentFolder={currentFolder}
        onUploadComplete={() => {
          setBulkUploadOpen(false);
          setTabValue(0);
        }}
      />

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onClose={() => setCreateFolderDialogOpen(false)}
        parentFolder={currentFolder}
      />

      {/* Speed Dial */}
      <SpeedDial
        ariaLabel="Upload actions"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};

export default DashboardPage;

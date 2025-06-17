import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UploadProvider } from './contexts/UploadContext';
import { ViewingProvider } from './contexts/ViewingContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FilesPage from './pages/FilesPage';
import FoldersPage from './pages/FoldersPage';
import UploadQueue from './components/files/UploadQueue';
import { useUploadContext } from './contexts/UploadContext';
import SharedPage from './pages/SharedPage';
import NotFoundPage from './pages/NotFoundPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

// Set up global error handler for queries
queryClient.setMutationDefaults(['upload'], {
  onError: (error) => {
    console.error('Upload mutation error:', error);
  },
});

// Global query error handler using query cache
queryClient.getQueryCache().config = {
  onError: (error, query) => {
    console.error('Query error:', error, 'Query key:', query.queryKey);
    // You can add toast notifications here for specific errors
    // toast.error(`Error: ${error.message}`);
  },
};

// Global mutation error handler using mutation cache
queryClient.getMutationCache().config = {
  onError: (error) => {
    console.error('Mutation error:', error);
    toast.error(`Operation failed: ${error.message}`);
  },
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

// Component to render the upload queue
const UploadQueueContainer = () => {
  const {
    uploads,
    pauseUpload,
    resumeUpload,
    removeUpload,
    retryUpload,
    clearCompleted,
    clearAll,
    totalProgress,
  } = useUploadContext();

  return (
    <UploadQueue
      items={uploads}
      onPause={pauseUpload}
      onResume={resumeUpload}
      onCancel={removeUpload}
      onRetry={retryUpload}
      onClearCompleted={clearCompleted}
      onClearAll={clearAll}
      totalProgress={totalProgress}
    />
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <UploadProvider>
              <ViewingProvider>
                <Router>
                  <ErrorBoundary>
                    <Routes>
                      {/* Public Routes - No Layout */}
                      <Route
                        path="/login"
                        element={
                          <ErrorBoundary>
                            <PublicRoute>
                              <LoginPage />
                            </PublicRoute>
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/register"
                        element={
                          <ErrorBoundary>
                            <PublicRoute>
                              <RegisterPage />
                            </PublicRoute>
                          </ErrorBoundary>
                        }
                      />

                      {/* Root redirect */}
                      <Route
                        path="/"
                        element={<Navigate to="/dashboard" replace />}
                      />

                      {/* Protected Routes with Layout */}
                      <Route
                        path="/dashboard"
                        element={
                          <ErrorBoundary>
                            <ProtectedRoute>
                              <Layout>
                                <DashboardPage />
                              </Layout>
                            </ProtectedRoute>
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/files"
                        element={
                          <ErrorBoundary>
                            <ProtectedRoute>
                              <Layout>
                                <FilesPage />
                              </Layout>
                            </ProtectedRoute>
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/folders"
                        element={
                          <ErrorBoundary>
                            <ProtectedRoute>
                              <Layout>
                                <FoldersPage />
                              </Layout>
                            </ProtectedRoute>
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/shared"
                        element={
                          <ErrorBoundary>
                            <ProtectedRoute>
                              <Layout>
                                <SharedPage />
                              </Layout>
                            </ProtectedRoute>
                          </ErrorBoundary>
                        }
                      />

                      {/* 404 Not Found - Standalone page without Layout */}
                      <Route
                        path="*"
                        element={
                          <ErrorBoundary>
                            <NotFoundPage />
                          </ErrorBoundary>
                        }
                      />
                    </Routes>
                  </ErrorBoundary>

                  {/* Upload Queue - Only show for authenticated users */}
                  <ProtectedRoute>
                    <UploadQueueContainer />
                  </ProtectedRoute>
                </Router>

                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#4aed88',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#ff6b6b',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </ViewingProvider>
            </UploadProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

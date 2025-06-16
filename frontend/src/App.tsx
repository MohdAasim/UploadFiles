import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UploadProvider } from "./contexts/UploadContext";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import FilesPage from "./pages/FilesPage";
import FoldersPage from "./pages/FoldersPage";
import UploadQueue from "./components/files/UploadQueue";
import { useUploadContext } from "./contexts/UploadContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
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
    return <div>Loading...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <UploadProvider>
            <Router>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <RegisterPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route
                            path="/dashboard"
                            element={<DashboardPage />}
                          />
                          <Route path="/files" element={<FilesPage />} />
                          <Route path="/folders" element={<FoldersPage />} />
                          <Route
                            path="/"
                            element={<Navigate to="/dashboard" />}
                          />
                          <Route
                            path="*"
                            element={<Navigate to="/dashboard" />}
                          />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <UploadQueueContainer />
            </Router>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: "#4aed88",
                    secondary: "#fff",
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: "#ff6b6b",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </UploadProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

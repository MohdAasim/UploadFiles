import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
// Import React explicitly to help with JSX in mocks
import React from 'react';

// Mock LoadingSpinner before importing App
jest.mock('./components/common/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

import App from './App';

// Mock Material UI components
jest.mock('@mui/material', () => ({
  CircularProgress: () => <div data-testid="circular-progress" />,
  Box: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mui-box">{children}</div>
  ),
  // Add any other components used in your App
}));

// Mock Material UI styled function
jest.mock('@mui/material/styles', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
  createTheme: jest.fn().mockReturnValue({}),
  styled: jest.fn().mockImplementation(() => {
    return jest
      .fn()
      .mockImplementation(({ children }: { children?: React.ReactNode }) => (
        <div>{children}</div>
      ));
  }),
}));

// Mock dependencies
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="router">{children}</div>
  ),
  Routes: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="routes">{children}</div>
  ),
  Route: ({ element }: { element: React.ReactNode }) => (
    <div data-testid="route">{element}</div>
  ),
  Navigate: () => <div data-testid="navigate">Navigate</div>,
}));

jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({
    setMutationDefaults: jest.fn(),
    getQueryCache: jest.fn().mockReturnValue({
      config: {},
    }),
    getMutationCache: jest.fn().mockReturnValue({
      config: {},
    }),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}));

jest.mock('@mui/material/CssBaseline', () => ({
  __esModule: true,
  default: () => <div data-testid="css-baseline" />,
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}));

// Mock context providers
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    loading: false,
  }),
}));

jest.mock('./contexts/UploadContext', () => ({
  UploadProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="upload-provider">{children}</div>
  ),
  useUploadContext: () => ({
    uploads: [],
    pauseUpload: jest.fn(),
    resumeUpload: jest.fn(),
    removeUpload: jest.fn(),
    retryUpload: jest.fn(),
    clearCompleted: jest.fn(),
    clearAll: jest.fn(),
    totalProgress: 0,
  }),
}));

jest.mock('./contexts/ViewingContext', () => ({
  ViewingProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="viewing-provider">{children}</div>
  ),
}));

// Mock components
jest.mock('./components/common/ErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

jest.mock('./components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock('./components/files/UploadQueue', () => ({
  __esModule: true,
  default: () => <div data-testid="upload-queue" />,
}));

jest.mock('./pages/LoginPage', () => ({
  __esModule: true,
  default: () => <div data-testid="login-page" />,
}));

jest.mock('./pages/RegisterPage', () => ({
  __esModule: true,
  default: () => <div data-testid="register-page" />,
}));

jest.mock('./pages/DashboardPage', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard-page" />,
}));

jest.mock('./pages/FilesPage', () => ({
  __esModule: true,
  default: () => <div data-testid="files-page" />,
}));

jest.mock('./pages/FoldersPage', () => ({
  __esModule: true,
  default: () => <div data-testid="folders-page" />,
}));

jest.mock('./pages/SharedPage', () => ({
  __esModule: true,
  default: () => <div data-testid="shared-page" />,
}));

jest.mock('./pages/NotFoundPage', () => ({
  __esModule: true,
  default: () => <div data-testid="not-found-page" />,
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders all provider wrappers', () => {
    render(<App />);

    // Use getAllByTestId instead of getByTestId for elements that might appear multiple times
    const errorBoundaries = screen.getAllByTestId('error-boundary');
    expect(errorBoundaries.length).toBeGreaterThan(0);
    expect(errorBoundaries[0]).toBeInTheDocument(); // Check the first error boundary

    // For unique elements, continue using getByTestId
    expect(screen.getByTestId('query-provider')).toBeInTheDocument();
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('upload-provider')).toBeInTheDocument();
    expect(screen.getByTestId('viewing-provider')).toBeInTheDocument();
  });

  it('renders router components', () => {
    render(<App />);

    expect(screen.getByTestId('router')).toBeInTheDocument();
    expect(screen.getByTestId('routes')).toBeInTheDocument();
    // Multiple route elements
    expect(screen.getAllByTestId('route').length).toBeGreaterThan(0);
  });

  it('includes toast notification system', () => {
    render(<App />);
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('renders with material-ui components', () => {
    render(<App />);
    expect(screen.getByTestId('css-baseline')).toBeInTheDocument();
  });

  it('has proper error handling with ErrorBoundary', () => {
    render(<App />);
    // Should have at least 2 error boundaries (main + routes)
    const errorBoundaries = screen.getAllByTestId('error-boundary');
    expect(errorBoundaries.length).toBeGreaterThanOrEqual(2);
  });

  describe('Protected and Public Routes', () => {
    it('renders protected routes when user is authenticated', () => {
      // Auth context is mocked to return a user
      render(<App />);

      // No need to check for every page, just verify some routes are rendered
      // and the user isn't redirected (no "navigate" component for protected routes)
      const routes = screen.getAllByTestId('route');
      expect(routes.length).toBeGreaterThan(1);
    });

    it('includes upload queue for authenticated users', () => {
      render(<App />);
      expect(screen.getByTestId('upload-queue')).toBeInTheDocument();
    });
  });
});

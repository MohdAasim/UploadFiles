import React, { Component } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  Home,
  BugReport,
  CloudUpload,
} from '@mui/icons-material';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Here you could send error to logging service
    // logErrorToService(error, errorInfo, this.state.errorId);
  }

  handleRefresh = () => {
    // Clear error state and refresh
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });

    // Refresh the page
    window.location.reload();
  };

  handleGoHome = () => {
    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });

    // Navigate to home
    window.location.href = '/dashboard';
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;

    // Create error report
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy to clipboard or send to support
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2));

    // You could also send to your error reporting service
    console.log('Error Report:', errorReport);
    alert('Error details copied to clipboard. Please share with support.');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              py: 4,
            }}
          >
            {/* Logo */}
            <CloudUpload
              sx={{
                fontSize: 60,
                color: 'primary.main',
                mb: 2,
                opacity: 0.8,
              }}
            />

            <Card
              sx={{
                maxWidth: 800,
                width: '100%',
                boxShadow: 3,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                {/* Error Icon */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <ErrorOutline
                    sx={{
                      fontSize: 80,
                      color: 'error.main',
                      mb: 2,
                    }}
                  />

                  <Typography variant="h4" component="h1" gutterBottom>
                    Something went wrong
                  </Typography>

                  <Typography variant="body1" color="text.secondary" paragraph>
                    We're sorry, but an unexpected error occurred. Our team has
                    been notified.
                  </Typography>
                </Box>

                {/* Error Details */}
                {this.state.error && (
                  <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={this.handleReportError}
                        startIcon={<BugReport />}
                      >
                        Report
                      </Button>
                    }
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Error ID: {this.state.errorId}
                    </Typography>
                    <Typography variant="body2">
                      {this.state.error.message}
                    </Typography>
                  </Alert>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Action Buttons */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ justifyContent: 'center' }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Refresh />}
                    onClick={this.handleRefresh}
                    sx={{ px: 4 }}
                  >
                    Refresh Page
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Home />}
                    onClick={this.handleGoHome}
                    sx={{ px: 4 }}
                  >
                    Go to Dashboard
                  </Button>
                </Stack>

                {/* Development Mode Details */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Development Details:
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.75rem',
                          maxHeight: 200,
                          overflow: 'auto',
                        }}
                      >
                        {this.state.error.stack}
                      </Typography>
                    </Alert>

                    {this.state.errorInfo && (
                      <Alert severity="warning">
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.75rem',
                            maxHeight: 200,
                            overflow: 'auto',
                          }}
                        >
                          {this.state.errorInfo.componentStack}
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

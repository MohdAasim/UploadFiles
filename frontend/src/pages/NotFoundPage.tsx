import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import { Home, ArrowBack, SearchOff, CloudUpload } from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 4,
        }}
      >
        {/* Logo */}
        <CloudUpload
          sx={{
            fontSize: 80,
            color: 'primary.main',
            mb: 2,
            opacity: 0.8,
          }}
        />

        {/* Main Content */}
        <Card
          sx={{
            maxWidth: 600,
            width: '100%',
            boxShadow: 3,
          }}
        >
          <CardContent sx={{ p: 6 }}>
            {/* 404 Icon */}
            <SearchOff
              sx={{
                fontSize: 120,
                color: 'grey.400',
                mb: 3,
              }}
            />

            {/* Error Message */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '4rem', md: '6rem' },
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 2,
              }}
            >
              404
            </Typography>

            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 600,
                mb: 2,
              }}
            >
              Page Not Found
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 4,
                maxWidth: 400,
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Sorry, the page you're looking for doesn't exist. It might have
              been moved, deleted, or you entered the wrong URL.
            </Typography>

            {/* Action Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<Home />}
                onClick={handleGoHome}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                }}
              >
                Go to Dashboard
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<ArrowBack />}
                onClick={handleGoBack}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                }}
              >
                Go Back
              </Button>
            </Stack>

            {/* Help Text */}
            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Need help? Try these common pages:
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  mt: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Button
                  size="small"
                  onClick={() => navigate('/files')}
                  sx={{ minWidth: 'auto' }}
                >
                  My Files
                </Button>
                <Button
                  size="small"
                  onClick={() => navigate('/folders')}
                  sx={{ minWidth: 'auto' }}
                >
                  Folders
                </Button>
                <Button
                  size="small"
                  onClick={() => navigate('/shared')}
                  sx={{ minWidth: 'auto' }}
                >
                  Shared
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          © 2024 UploadFiles. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default NotFoundPage;

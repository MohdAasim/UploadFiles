import React from 'react';
import { render, screen } from '@testing-library/react';
import UploadProgressBar from '../UploadProgressBar';
import { useUploadContext } from '../../../contexts/UploadContext';

// Mock the context hook
jest.mock('../../../contexts/UploadContext', () => ({
  useUploadContext: jest.fn(),
}));

describe('UploadProgressBar Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders nothing when no active uploads', () => {
    // Mock empty uploads array
    (useUploadContext as jest.Mock).mockReturnValue({
      uploads: [],
      totalProgress: 0,
    });

    const { container } = render(<UploadProgressBar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when uploads are not in uploading state', () => {
    // Mock uploads but none are active
    (useUploadContext as jest.Mock).mockReturnValue({
      uploads: [
        { id: '1', status: 'completed', progress: 100 },
        { id: '2', status: 'error', progress: 50 },
      ],
      totalProgress: 75,
    });

    const { container } = render(<UploadProgressBar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders progress bar for a single active upload', () => {
    // Mock a single active upload
    (useUploadContext as jest.Mock).mockReturnValue({
      uploads: [{ id: '1', status: 'uploading', progress: 42 }],
      totalProgress: 42,
    });

    render(<UploadProgressBar />);

    // Check for progress text
    expect(screen.getByText('Uploading 1 file...')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();

    // Check for progress bar
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '42');
  });

  it('renders progress bar for multiple active uploads', () => {
    // Mock multiple active uploads
    (useUploadContext as jest.Mock).mockReturnValue({
      uploads: [
        { id: '1', status: 'uploading', progress: 30 },
        { id: '2', status: 'uploading', progress: 70 },
      ],
      totalProgress: 50,
    });

    render(<UploadProgressBar />);

    // Check for progress text with plural
    expect(screen.getByText('Uploading 2 files...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Check for progress bar
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('displays rounded percentage values', () => {
    // Mock with non-integer percentage
    (useUploadContext as jest.Mock).mockReturnValue({
      uploads: [{ id: '1', status: 'uploading', progress: 33.33 }],
      totalProgress: 33.33,
    });

    render(<UploadProgressBar />);

    // Should show rounded percentage
    expect(screen.getByText('33%')).toBeInTheDocument();
  });
});

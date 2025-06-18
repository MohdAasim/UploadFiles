import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardSpeedDial from '../DashboardSpeedDial';
import { CloudUpload, CreateNewFolder, FileUpload } from '@mui/icons-material';

// Mock actions for testing
const mockHandleUpload = jest.fn();
const mockHandleCreateFolder = jest.fn();
const mockHandleImport = jest.fn();

// Create actions array to match component props
const mockActions = [
  { name: 'Upload File', icon: <FileUpload />, onClick: mockHandleUpload },
  { name: 'Create Folder', icon: <CreateNewFolder />, onClick: mockHandleCreateFolder },
  { name: 'Import', icon: <CloudUpload />, onClick: mockHandleImport }
];

describe('DashboardSpeedDial Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a speed dial button', () => {
    render(<DashboardSpeedDial actions={mockActions} />);
    
    const speedDialButton = screen.getByLabelText(/upload actions/i);
    expect(speedDialButton).toBeInTheDocument();
  });
  
  it('shows actions when speed dial is opened', async () => {
    render(<DashboardSpeedDial actions={mockActions} />);
    
    // Click to open the speed dial
    const speedDialButton = screen.getByLabelText(/upload actions/i);
    fireEvent.click(speedDialButton);
    
    // Wait for actions to appear
    await waitFor(() => {
      expect(screen.getByText('Upload File')).toBeInTheDocument();
      expect(screen.getByText('Create Folder')).toBeInTheDocument();
      expect(screen.getByText('Import')).toBeInTheDocument();
    });
  });
  
  it('calls upload handler when upload action is clicked', async () => {
    render(<DashboardSpeedDial actions={mockActions} />);
    
    // Open speed dial
    const speedDialButton = screen.getByLabelText(/upload actions/i);
    fireEvent.click(speedDialButton);
    
    // Click upload action
    await waitFor(() => {
      const uploadAction = screen.getByText('Upload File');
      fireEvent.click(uploadAction);
    });
    
    expect(mockHandleUpload).toHaveBeenCalledTimes(1);
    expect(mockHandleCreateFolder).not.toHaveBeenCalled();
    expect(mockHandleImport).not.toHaveBeenCalled();
  });
  
  it('calls create folder handler when create folder action is clicked', async () => {
    render(<DashboardSpeedDial actions={mockActions} />);
    
    // Open speed dial
    const speedDialButton = screen.getByLabelText(/upload actions/i);
    fireEvent.click(speedDialButton);
    
    // Click create folder action
    await waitFor(() => {
      const createFolderAction = screen.getByText('Create Folder');
      fireEvent.click(createFolderAction);
    });
    
    expect(mockHandleCreateFolder).toHaveBeenCalledTimes(1);
    expect(mockHandleUpload).not.toHaveBeenCalled();
    expect(mockHandleImport).not.toHaveBeenCalled();
  });
  
  it('calls import handler when import action is clicked', async () => {
    render(<DashboardSpeedDial actions={mockActions} />);
    
    // Open speed dial
    const speedDialButton = screen.getByLabelText(/upload actions/i);
    fireEvent.click(speedDialButton);
    
    // Click import action
    await waitFor(() => {
      const importAction = screen.getByText('Import');
      fireEvent.click(importAction);
    });
    
    expect(mockHandleImport).toHaveBeenCalledTimes(1);
    expect(mockHandleUpload).not.toHaveBeenCalled();
    expect(mockHandleCreateFolder).not.toHaveBeenCalled();
  });
  
  it('closes the speed dial after an action is clicked', async () => {
    render(<DashboardSpeedDial actions={mockActions} />);
    
    // Open speed dial
    const speedDialButton = screen.getByLabelText(/upload actions/i);
    fireEvent.click(speedDialButton);
    
    // Click an action
    await waitFor(() => {
      const uploadAction = screen.getByText('Upload File');
      fireEvent.click(uploadAction);
    });
    
    // Verify actions are no longer visible
    await waitFor(() => {
      expect(screen.queryByText('Upload File')).not.toBeInTheDocument();
    });
  });
  
  it('renders all provided actions', () => {
    // Create a test with additional action
    const extendedActions = [
      ...mockActions,
      { name: 'Delete All', icon: <span>🗑️</span>, onClick: jest.fn() }
    ];
    
    render(<DashboardSpeedDial actions={extendedActions} />);
    
    // Open speed dial
    const speedDialButton = screen.getByLabelText(/upload actions/i);
    fireEvent.click(speedDialButton);
    
    // Check all actions are rendered
    waitFor(() => {
      expect(screen.getByText('Upload File')).toBeInTheDocument();
      expect(screen.getByText('Create Folder')).toBeInTheDocument();
      expect(screen.getByText('Import')).toBeInTheDocument();
      expect(screen.getByText('Delete All')).toBeInTheDocument();
    });
  });
});
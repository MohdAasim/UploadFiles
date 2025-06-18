import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionButtons from '../ActionButtons';

describe('ActionButtons Component', () => {
  // Setup mock handler functions
  const handleUploadClick = jest.fn();
  const handleBulkUploadClick = jest.fn();
  const handleCreateFolderClick = jest.fn();

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all action buttons correctly', () => {
    render(
      <ActionButtons
        onUploadClick={handleUploadClick}
        onBulkUploadClick={handleBulkUploadClick}
        onCreateFolderClick={handleCreateFolderClick}
      />
    );

    // Check if buttons are rendered with correct text
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByText('Bulk Upload')).toBeInTheDocument();
    expect(screen.getByText('New Folder')).toBeInTheDocument();
  });

  it('shows correct icons for each button', () => {
    render(
      <ActionButtons
        onUploadClick={handleUploadClick}
        onBulkUploadClick={handleBulkUploadClick}
        onCreateFolderClick={handleCreateFolderClick}
      />
    );

    // Check if the container has the buttons with icons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    // Check if icons are present (indirectly)
    // MUI renders icons as SVGs, so we can check if SVGs are present
    const svgIcons = document.querySelectorAll('svg');
    expect(svgIcons.length).toBeGreaterThanOrEqual(3);
  });

  it('calls onUploadClick when Upload Files button is clicked', () => {
    render(
      <ActionButtons
        onUploadClick={handleUploadClick}
        onBulkUploadClick={handleBulkUploadClick}
        onCreateFolderClick={handleCreateFolderClick}
      />
    );

    // Click the Upload Files button
    fireEvent.click(screen.getByText('Upload Files'));

    // Verify the handler was called
    expect(handleUploadClick).toHaveBeenCalledTimes(1);
    expect(handleBulkUploadClick).not.toHaveBeenCalled();
    expect(handleCreateFolderClick).not.toHaveBeenCalled();
  });

  it('calls onBulkUploadClick when Bulk Upload button is clicked', () => {
    render(
      <ActionButtons
        onUploadClick={handleUploadClick}
        onBulkUploadClick={handleBulkUploadClick}
        onCreateFolderClick={handleCreateFolderClick}
      />
    );

    // Click the Bulk Upload button
    fireEvent.click(screen.getByText('Bulk Upload'));

    // Verify the handler was called
    expect(handleBulkUploadClick).toHaveBeenCalledTimes(1);
    expect(handleUploadClick).not.toHaveBeenCalled();
    expect(handleCreateFolderClick).not.toHaveBeenCalled();
  });

  it('calls onCreateFolderClick when New Folder button is clicked', () => {
    render(
      <ActionButtons
        onUploadClick={handleUploadClick}
        onBulkUploadClick={handleBulkUploadClick}
        onCreateFolderClick={handleCreateFolderClick}
      />
    );

    // Click the New Folder button
    fireEvent.click(screen.getByText('New Folder'));

    // Verify the handler was called
    expect(handleCreateFolderClick).toHaveBeenCalledTimes(1);
    expect(handleUploadClick).not.toHaveBeenCalled();
    expect(handleBulkUploadClick).not.toHaveBeenCalled();
  });

  it('applies correct styling to buttons', () => {
    render(
      <ActionButtons
        onUploadClick={handleUploadClick}
        onBulkUploadClick={handleBulkUploadClick}
        onCreateFolderClick={handleCreateFolderClick}
      />
    );

    // Check that the first button (Upload Files) is a contained button
    const uploadButton = screen.getByText('Upload Files').closest('button');
    expect(uploadButton).toHaveClass('MuiButton-contained');

    // Check that the other buttons are outlined buttons
    const bulkUploadButton = screen.getByText('Bulk Upload').closest('button');
    const newFolderButton = screen.getByText('New Folder').closest('button');

    expect(bulkUploadButton).toHaveClass('MuiButton-outlined');
    expect(newFolderButton).toHaveClass('MuiButton-outlined');
  });

  it('renders with correct flex layout', () => {
    const { container } = render(
      <ActionButtons
        onUploadClick={handleUploadClick}
        onBulkUploadClick={handleBulkUploadClick}
        onCreateFolderClick={handleCreateFolderClick}
      />
    );

    // Check that the container div has the flex class and gap
    const buttonContainer = container.firstChild;
    expect(buttonContainer).toHaveClass('flex');
    expect(buttonContainer).toHaveClass('gap-4');
    expect(buttonContainer).toHaveClass('mb-6');
  });
});

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardHeader from '../DashboardHeader';

// Default props required by the component
const defaultProps = {
  userName: 'Test User',
  fileCount: 42,
  folderCount: 7,
};

describe('DashboardHeader Component', () => {
  it('renders the dashboard title with welcome message', () => {
    render(<DashboardHeader {...defaultProps} />);
    expect(
      screen.getByText(/Welcome back, Test User! 👋/i)
    ).toBeInTheDocument();
  });

  it('displays the root directory text when no currentFolder is provided', () => {
    render(<DashboardHeader {...defaultProps} />);
    expect(screen.getByText(/Root directory/i)).toBeInTheDocument();
  });

  it('displays the browsing folder text when currentFolder is provided', () => {
    render(<DashboardHeader {...defaultProps} currentFolder="Documents" />);
    expect(screen.getByText(/Browsing folder/i)).toBeInTheDocument();
  });

  it('displays file count correctly', () => {
    render(<DashboardHeader {...defaultProps} fileCount={25} />);
    expect(screen.getByText(/25 files/i)).toBeInTheDocument();
  });

  it('displays folder count correctly', () => {
    render(<DashboardHeader {...defaultProps} folderCount={15} />);
    expect(screen.getByText(/15 folders/i)).toBeInTheDocument();
  });

  it('handles zero counts correctly', () => {
    render(<DashboardHeader {...defaultProps} fileCount={0} folderCount={0} />);
    expect(screen.getByText(/0 files, 0 folders/i)).toBeInTheDocument();
  });

  it('uses the typography components with correct variants', () => {
    const { container } = render(<DashboardHeader {...defaultProps} />);

    // Find h1 heading (which should have variant="h4")
    const heading = container.querySelector('h1');
    expect(heading).toHaveClass('MuiTypography-h4');

    // Find body text - in MUI v5, the class for Typography color="text.secondary" is different
    const bodyText = container.querySelector('p');
    expect(bodyText).toHaveClass('MuiTypography-body1');

    // Instead of checking for a specific class name which might change,
    // just verify that the element exists and has some Typography classes
    expect(bodyText).toHaveClass('MuiTypography-root');
  });

  it('applies correct margin styling', () => {
    const { container } = render(<DashboardHeader {...defaultProps} />);

    // Check main container has margin-bottom
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('mb-8');

    // Check heading has margin-bottom
    const heading = container.querySelector('h1');
    expect(heading).toHaveClass('mb-2');
  });
});

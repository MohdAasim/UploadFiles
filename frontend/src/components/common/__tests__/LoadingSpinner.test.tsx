import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders a circular progress indicator', () => {
    render(<LoadingSpinner />);
    
    // Check for the CircularProgress component
    const progressElement = screen.getByRole('progressbar');
    expect(progressElement).toBeInTheDocument();
  });

  it('renders within a centered box container', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check for the Box with correct styling
    const boxElement = container.firstChild;
    expect(boxElement).toHaveStyle('display: flex');
    expect(boxElement).toHaveStyle('justify-content: center');
    expect(boxElement).toHaveStyle('align-items: center');
    expect(boxElement).toHaveStyle('min-height: 200px');
  });
});
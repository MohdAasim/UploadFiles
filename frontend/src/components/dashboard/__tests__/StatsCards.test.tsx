jest.mock('@mui/material', () => {
  const MockCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="mui-card" className={className}>
      {children}
    </div>
  );

  const MockCardContent = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mui-card-content">{children}</div>
  );

  const MockTypography = ({
    children,
    variant,
    className,
    color,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
    color?: string;
  }) => (
    <div
      data-testid="mui-typography"
      className={className}
      data-variant={variant}
      data-color={color}
    >
      {children}
    </div>
  );

  const MockBox = ({
    children,
    className,
    sx,
  }: {
    children: React.ReactNode;
    className?: string;
    sx?: Record<string, unknown>;
  }) => (
    <div data-testid="mui-box" className={className} style={sx}>
      {children}
    </div>
  );

  return {
    Card: MockCard,
    CardContent: MockCardContent,
    Typography: MockTypography,
    Box: MockBox,
  };
});

jest.mock('@mui/icons-material', () => ({
  CloudUpload: () => <div data-testid="cloud-upload-icon">CloudUploadIcon</div>,
}));

// Now import React and other dependencies
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsCards from '../StatsCards';
import type { StatItem } from '../StatsCards';

describe('StatsCards Component', () => {
  const mockStats: StatItem[] = [
    {
      label: 'Total Files',
      value: '150',
      icon: <div data-testid="cloud-upload-icon">CloudUploadIcon</div>,
      color: '#4CAF50',
    },
    {
      label: 'Storage Used',
      value: '2.5 GB',
      icon: <div data-testid="cloud-upload-icon">CloudUploadIcon</div>,
      color: '#2196F3',
    },
  ];

  it('renders without crashing', () => {
    render(React.createElement(StatsCards, { stats: mockStats }));
    // Use getAllByTestId instead of getByTestId since we have multiple cards
    const cards = screen.getAllByTestId('mui-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders correct number of stat cards', () => {
    render(React.createElement(StatsCards, { stats: mockStats }));
    const cards = screen.getAllByTestId('mui-card');
    expect(cards).toHaveLength(2);
  });

  it('displays correct stat information', () => {
    render(React.createElement(StatsCards, { stats: mockStats }));
    const typography = screen.getAllByTestId('mui-typography');

    expect(typography[0]).toHaveTextContent('150');
    expect(typography[1]).toHaveTextContent('Total Files');
    expect(typography[2]).toHaveTextContent('2.5 GB');
    expect(typography[3]).toHaveTextContent('Storage Used');
  });

  it('applies correct color styling', () => {
    render(React.createElement(StatsCards, { stats: mockStats }));
    const boxes = screen.getAllByTestId('mui-box');
    const colorBoxes = boxes.filter((box) => box.style.backgroundColor);

    // Test using regex to match rgba values
    expect(colorBoxes[0].style.backgroundColor).toMatch(/rgba\(76,\s*175,\s*80,\s*0\.125\)/);
    expect(colorBoxes[0].style.color).toBe('rgb(76, 175, 80)');
    expect(colorBoxes[1].style.backgroundColor).toMatch(/rgba\(33,\s*150,\s*243,\s*0\.125\)/);
    expect(colorBoxes[1].style.color).toBe('rgb(33, 150, 243)');
  });
});

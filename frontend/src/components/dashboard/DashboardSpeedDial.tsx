import React from 'react';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';

interface SpeedDialActionItem {
  name: string;
  icon: React.ReactElement;
  onClick: () => void;
}

interface DashboardSpeedDialProps {
  actions: SpeedDialActionItem[];
}

const DashboardSpeedDial: React.FC<DashboardSpeedDialProps> = ({ actions }) => {
  return (
    <SpeedDial
      ariaLabel="Upload actions"
      className="fixed bottom-4 right-4"
      icon={<SpeedDialIcon />}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={action.onClick}
        />
      ))}
    </SpeedDial>
  );
};

export default DashboardSpeedDial;

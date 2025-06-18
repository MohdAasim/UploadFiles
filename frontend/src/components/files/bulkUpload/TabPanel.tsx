import React from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`bulk-upload-tabpanel-${index}`}
    aria-labelledby={`bulk-upload-tab-${index}`}
    {...other}
  >
    {value === index && <div className="pt-3">{children}</div>}
  </div>
);

export default TabPanel;

import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export interface StatItem {
  label: string;
  value: string;
  icon: React.ReactElement;
  color: string;
}

interface StatsCardsProps {
  stats: StatItem[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="flex flex-wrap gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="flex-1 min-w-[250px] max-w-[300px] basis-[300px]"
        >
          <Card className="h-full">
            <CardContent>
              <Box className="flex items-center mb-4">
                <Box
                  className="p-2 rounded-lg mr-4"
                  sx={{
                    backgroundColor: `${stat.color}20`,
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </Box>
                <div>
                  <Typography
                    variant="h4"
                    component="div"
                    className="font-semibold"
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
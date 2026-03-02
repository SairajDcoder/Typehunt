import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface TypeHuntBadgeProps {
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}

export const TypeHuntBadge: React.FC<TypeHuntBadgeProps> = ({ rank }) => {
  const { colors } = useTheme();

  const getRankColor = () => {
    switch (rank) {
      case 'Bronze':
        return '#CD7F32';
      case 'Silver':
        return '#C0C0C0';
      case 'Gold':
        return '#FFD700';
      case 'Platinum':
        return '#E5E4E2';
      case 'Diamond':
        return colors.accent;
    }
  };

  return (
    <div
      className="inline-flex items-center px-4 py-2 rounded-full shadow-md"
      style={{
        backgroundColor: getRankColor(),
        color: rank === 'Diamond' ? colors.primaryDark : '#ffffff',
      }}
    >
      <span className="font-bold">{rank}</span>
    </div>
  );
};

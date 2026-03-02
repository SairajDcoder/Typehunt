import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';

interface TypeHuntCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  glassmorphism?: boolean;
}

export const TypeHuntCard: React.FC<TypeHuntCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  glassmorphism = false,
}) => {
  const { colors } = useTheme();

  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverable ? { scale: 1.05, boxShadow: `0 0 20px ${colors.accent}` } : {}}
      transition={{ duration: 0.3 }}
      className={`rounded-xl p-8 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        backgroundColor: glassmorphism 
          ? `${colors.primaryMid}20` 
          : colors.primaryMid,
        backdropFilter: glassmorphism ? 'blur(10px)' : 'none',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      {children}
    </motion.div>
  );
};

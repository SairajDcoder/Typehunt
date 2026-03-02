import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';

interface TypeHuntButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'accent' | 'highlight' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const TypeHuntButton: React.FC<TypeHuntButtonProps> = ({
  children,
  onClick,
  variant = 'accent',
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primaryDark;
      case 'accent':
        return colors.accent;
      case 'highlight':
        return colors.highlightAccent || colors.accent;
      case 'ghost':
        return 'transparent';
      default:
        return colors.accent;
    }
  };

  const getTextColor = () => {
    if (variant === 'ghost') return colors.primaryDark;
    if (variant === 'primary') return '#ffffff';
    return colors.primaryDark;
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2';
      case 'md':
        return 'px-6 py-3';
      case 'lg':
        return 'px-8 py-4';
    }
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.2 }}
      className={`${getPadding()} rounded-lg transition-all duration-200 ${
        variant === 'ghost' ? 'border-2' : 'shadow-lg hover:shadow-xl'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={{
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        borderColor: variant === 'ghost' ? colors.primaryMid : 'transparent',
      }}
    >
      {children}
    </motion.button>
  );
};

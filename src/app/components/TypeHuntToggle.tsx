import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface TypeHuntToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const TypeHuntToggle: React.FC<TypeHuntToggleProps> = ({
  checked,
  onChange,
  label,
}) => {
  const { colors } = useTheme();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200"
        style={{
          backgroundColor: checked ? colors.accent : '#cbd5e1',
        }}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
};

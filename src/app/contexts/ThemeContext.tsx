import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeType = 'blue-frost' | 'teal-ocean';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: {
    primaryDark: string;
    primaryMid: string;
    accent: string;
    highlightAccent?: string;
    backgroundNeutral?: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('typehunt-theme');
    return (saved as ThemeType) || 'blue-frost';
  });

  useEffect(() => {
    localStorage.setItem('typehunt-theme', theme);
  }, [theme]);

  const colors = theme === 'blue-frost' 
    ? {
        primaryDark: '#355872',
        primaryMid: '#7AAACE',
        accent: '#9CD5FF',
        backgroundNeutral: '#F7F8F0'
      }
    : {
        primaryDark: '#005461',
        primaryMid: '#0C7779',
        accent: '#249E94',
        highlightAccent: '#3BC1A8'
      };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

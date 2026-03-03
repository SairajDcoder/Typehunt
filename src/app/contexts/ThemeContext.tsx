import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'blue-frost' | 'teal-ocean' | 'olive-garden' | 'midnight-cyan' | 'ocean-blue' | 'soft-periwinkle' | 'dark-forest' | 'neon-noir' | 'berry-rose' | 'mint-teal' | 'steel-gray' | 'warm-sand' | 'charcoal-taupe' | 'sage-garden' | 'neon-purple' | 'deep-indigo';

export interface ThemeColors {
  primaryDark: string;
  primaryMid: string;
  accent: string;
  highlightAccent: string;
  backgroundNeutral: string;
}

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: ThemeColors;
}

const THEMES: Record<ThemeType, ThemeColors> = {
  'blue-frost': {
    primaryDark: '#355872',
    primaryMid: '#7AAACE',
    accent: '#9CD5FF',
    highlightAccent: '#B8E2FF',
    backgroundNeutral: '#F7F8F0',
  },
  'teal-ocean': {
    primaryDark: '#005461',
    primaryMid: '#0C7779',
    accent: '#249E94',
    highlightAccent: '#3BC1A8',
    backgroundNeutral: '#E0F5F0',
  },
  'olive-garden': {
    primaryDark: '#414315',
    primaryMid: '#AEB784',
    accent: '#E3D5B8',
    highlightAccent: '#F8F3E1',
    backgroundNeutral: '#F8F3E1',
  },
  'midnight-cyan': {
    primaryDark: '#222831',
    primaryMid: '#393E46',
    accent: '#00ADB5',
    highlightAccent: '#EEEEEE',
    backgroundNeutral: '#EEEEEE',
  },
  'ocean-blue': {
    primaryDark: '#1b2838',
    primaryMid: '#2b6cb0',
    accent: '#4da6ff',
    highlightAccent: '#90cdf4',
    backgroundNeutral: '#e2ecf6',
  },
  'soft-periwinkle': {
    primaryDark: '#27374D',
    primaryMid: '#526D82',
    accent: '#9DB2BF',
    highlightAccent: '#DDE6ED',
    backgroundNeutral: '#DDE6ED',
  },
  'dark-forest': {
    primaryDark: '#040D12',
    primaryMid: '#183D3D',
    accent: '#5C8374',
    highlightAccent: '#93B1A6',
    backgroundNeutral: '#B5D5C5',
  },
  'neon-noir': {
    primaryDark: '#212121',
    primaryMid: '#323232',
    accent: '#14FFEC',
    highlightAccent: '#0D7377',
    backgroundNeutral: '#E0FFFE',
  },
  'berry-rose': {
    primaryDark: '#53354A',
    primaryMid: '#903749',
    accent: '#E84A5F',
    highlightAccent: '#FF8E9E',
    backgroundNeutral: '#FFE0E6',
  },
  'mint-teal': {
    primaryDark: '#2C3333',
    primaryMid: '#395B64',
    accent: '#A5C9CA',
    highlightAccent: '#E7F6F2',
    backgroundNeutral: '#E7F6F2',
  },
  'steel-gray': {
    primaryDark: '#526D82',
    primaryMid: '#91A7B0',
    accent: '#C9D6DF',
    highlightAccent: '#F0F5F9',
    backgroundNeutral: '#F0F5F9',
  },
  'warm-sand': {
    primaryDark: '#7D5A50',
    primaryMid: '#B4846B',
    accent: '#CE9461',
    highlightAccent: '#FCDEC0',
    backgroundNeutral: '#FFF3E6',
  },
  'charcoal-taupe': {
    primaryDark: '#2C363F',
    primaryMid: '#4E4F50',
    accent: '#A27B5C',
    highlightAccent: '#DCD7C9',
    backgroundNeutral: '#EDE8E0',
  },
  'sage-garden': {
    primaryDark: '#40513B',
    primaryMid: '#609966',
    accent: '#8DB596',
    highlightAccent: '#EDF1D6',
    backgroundNeutral: '#F4F7E8',
  },
  'neon-purple': {
    primaryDark: '#000000',
    primaryMid: '#52057B',
    accent: '#BC6FF1',
    highlightAccent: '#892CDC',
    backgroundNeutral: '#E8D5F5',
  },
  'deep-indigo': {
    primaryDark: '#070F2B',
    primaryMid: '#1B1A55',
    accent: '#535C91',
    highlightAccent: '#9290C3',
    backgroundNeutral: '#D5D4E8',
  },
};

export const THEME_LIST: { id: ThemeType; name: string; colors: ThemeColors }[] = [
  { id: 'blue-frost', name: 'Blue Frost', colors: THEMES['blue-frost'] },
  { id: 'teal-ocean', name: 'Teal Ocean', colors: THEMES['teal-ocean'] },
  { id: 'olive-garden', name: 'Olive Garden', colors: THEMES['olive-garden'] },
  { id: 'midnight-cyan', name: 'Midnight Cyan', colors: THEMES['midnight-cyan'] },
  { id: 'ocean-blue', name: 'Ocean Blue', colors: THEMES['ocean-blue'] },
  { id: 'soft-periwinkle', name: 'Soft Periwinkle', colors: THEMES['soft-periwinkle'] },
  { id: 'dark-forest', name: 'Dark Forest', colors: THEMES['dark-forest'] },
  { id: 'neon-noir', name: 'Neon Noir', colors: THEMES['neon-noir'] },
  { id: 'berry-rose', name: 'Berry Rose', colors: THEMES['berry-rose'] },
  { id: 'mint-teal', name: 'Mint Teal', colors: THEMES['mint-teal'] },
  { id: 'steel-gray', name: 'Steel Gray', colors: THEMES['steel-gray'] },
  { id: 'warm-sand', name: 'Warm Sand', colors: THEMES['warm-sand'] },
  { id: 'charcoal-taupe', name: 'Charcoal Taupe', colors: THEMES['charcoal-taupe'] },
  { id: 'sage-garden', name: 'Sage Garden', colors: THEMES['sage-garden'] },
  { id: 'neon-purple', name: 'Neon Purple', colors: THEMES['neon-purple'] },
  { id: 'deep-indigo', name: 'Deep Indigo', colors: THEMES['deep-indigo'] },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('typehunt-theme');
    return (saved as ThemeType) || 'blue-frost';
  });

  useEffect(() => {
    localStorage.setItem('typehunt-theme', theme);
  }, [theme]);

  const colors = THEMES[theme] || THEMES['blue-frost'];

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

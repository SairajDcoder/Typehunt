import React, { createContext, useContext, useState, useEffect } from 'react';

export type KeyboardSoundType = 'mechanical' | 'typewriter' | 'silent';
export type WordCategoryType = 'common' | 'advanced' | 'programming' | 'quotes';
export type LanguageType = 'english';

interface SettingsContextType {
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  keyboardSound: KeyboardSoundType;
  setKeyboardSound: (v: KeyboardSoundType) => void;
  wordCategory: WordCategoryType;
  setWordCategory: (v: WordCategoryType) => void;
  language: LanguageType;
  setLanguage: (v: LanguageType) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function loadSetting<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(`typehunt-${key}`);
    if (saved !== null) return JSON.parse(saved) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveSetting(key: string, value: any) {
  localStorage.setItem(`typehunt-${key}`, JSON.stringify(value));
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, _setSoundEnabled] = useState(() => loadSetting('soundEnabled', true));
  const [keyboardSound, _setKeyboardSound] = useState<KeyboardSoundType>(() => loadSetting('keyboardSound', 'mechanical'));
  const [wordCategory, _setWordCategory] = useState<WordCategoryType>(() => loadSetting('wordCategory', 'common'));
  const [language, _setLanguage] = useState<LanguageType>(() => loadSetting('language', 'english'));

  const setSoundEnabled = (v: boolean) => { _setSoundEnabled(v); saveSetting('soundEnabled', v); };
  const setKeyboardSound = (v: KeyboardSoundType) => { _setKeyboardSound(v); saveSetting('keyboardSound', v); };
  const setWordCategory = (v: WordCategoryType) => { _setWordCategory(v); saveSetting('wordCategory', v); };
  const setLanguage = (v: LanguageType) => { _setLanguage(v); saveSetting('language', v); };

  return (
    <SettingsContext.Provider value={{
      soundEnabled, setSoundEnabled,
      keyboardSound, setKeyboardSound,
      wordCategory, setWordCategory,
      language, setLanguage,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

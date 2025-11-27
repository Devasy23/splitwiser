import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { THEMES } from '../constants';

type ThemeStyle = 'neobrutalism' | 'glassmorphism';
type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  style: ThemeStyle;
  mode: ThemeMode;
  toggleStyle: () => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [style, setStyle] = useState<ThemeStyle>(THEMES.NEOBRUTALISM as ThemeStyle);
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const toggleStyle = () => {
    setStyle(prev => prev === THEMES.NEOBRUTALISM ? THEMES.GLASSMORPHISM as ThemeStyle : THEMES.NEOBRUTALISM as ThemeStyle);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ style, mode, toggleStyle, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

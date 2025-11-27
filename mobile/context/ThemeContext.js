import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { THEMES } from '../constants/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [style, setStyle] = useState(THEMES.NEOBRUTALISM);
  const [mode, setMode] = useState(systemScheme || 'light');

  const toggleStyle = () => {
    setStyle(prev => prev === THEMES.NEOBRUTALISM ? THEMES.GLASSMORPHISM : THEMES.NEOBRUTALISM);
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

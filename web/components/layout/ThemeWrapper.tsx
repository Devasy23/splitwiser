import React from 'react';
import { THEMES } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { style, mode } = useTheme();

  let bgClass = "";

  if (style === THEMES.NEOBRUTALISM) {
    bgClass = mode === 'dark' ? 'theme-neo-dark text-white' : 'theme-neo-light text-black';
  } else {
    // Glassmorphism - Vibrant gradients
    bgClass = mode === 'dark' 
      ? 'theme-glass-dark text-white' 
      : 'theme-glass-light text-gray-900';
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${bgClass} font-sans`}>
      {children}
    </div>
  );
};

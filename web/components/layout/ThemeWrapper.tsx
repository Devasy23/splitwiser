import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { THEMES } from '../../constants';

export const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { style, mode } = useTheme();

  let bgClass = "";

  if (style === THEMES.NEOBRUTALISM) {
    bgClass = mode === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-[#fffdf5] text-black'; // Off-yellowish white for Neo Light
  } else {
    // Glassmorphism - Vibrant gradients
    bgClass = mode === 'dark' 
      ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black text-white' 
      : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-purple-100 to-white text-gray-900';
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${bgClass} font-sans`}>
      {children}
    </div>
  );
};

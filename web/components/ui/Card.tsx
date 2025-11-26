import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { THEMES } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  const { style, mode } = useTheme();

  let themeStyles = "";

  if (style === THEMES.NEOBRUTALISM) {
    themeStyles = `border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none ${mode === 'dark' ? 'bg-zinc-800 text-white' : 'bg-white text-black'}`;
  } else {
    // Glassmorphism
    themeStyles = `rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl ${mode === 'dark' ? 'bg-black/40 text-white' : 'bg-white/40 text-gray-900'}`;
  }

  return (
    <div className={`p-6 ${themeStyles} ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className={`text-xl font-bold ${style === THEMES.NEOBRUTALISM ? 'uppercase font-mono' : ''}`}>{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

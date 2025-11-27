import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { THEMES } from '../../constants';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  const { style, mode } = useTheme();

  let baseClass = "animate-pulse rounded";
  
  if (style === THEMES.NEOBRUTALISM) {
    baseClass += mode === 'dark' ? " bg-zinc-800" : " bg-gray-300";
  } else {
    baseClass += " bg-white/10 backdrop-blur-sm";
  }

  return (
    <div className={`${baseClass} ${className}`}></div>
  );
};
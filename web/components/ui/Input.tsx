import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { THEMES } from '../../constants';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  const { style, mode } = useTheme();

  let inputStyles = "w-full outline-none transition-all duration-200";

  if (style === THEMES.NEOBRUTALISM) {
    inputStyles += ` p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5 rounded-none font-bold ${mode === 'dark' ? 'bg-zinc-800 text-white' : 'bg-white text-black'}`;
  } else {
    inputStyles += ` p-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 ${mode === 'dark' ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'}`;
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className={`text-sm font-semibold ${style === THEMES.NEOBRUTALISM ? 'uppercase' : 'ml-1 opacity-80'}`}>{label}</label>}
      <input className={`${inputStyles} ${className}`} {...props} />
      {error && <span className="text-red-500 text-xs font-bold mt-1">{error}</span>}
    </div>
  );
};

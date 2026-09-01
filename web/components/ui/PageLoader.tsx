import React from 'react';
import { THEMES } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { Spinner } from './Spinner';

export const PageLoader: React.FC = () => {
  const { style, mode } = useTheme();
  const isNeo = style === THEMES.NEOBRUTALISM;

  const containerClass = `h-screen w-full flex flex-col items-center justify-center ${
    isNeo
      ? mode === 'dark' ? 'bg-zinc-900 text-white' : 'bg-white text-black'
      : 'bg-transparent text-current'
  }`;

  return (
    <div className={containerClass} aria-live="polite" aria-busy="true">
      <div className={`flex flex-col items-center gap-4 ${isNeo ? 'p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20'}`}>
        <Spinner size={48} />
        <p className={`text-lg font-bold ${isNeo ? 'uppercase tracking-widest' : ''}`}>
          Loading...
        </p>
      </div>
    </div>
  );
};

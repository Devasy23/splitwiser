import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { THEMES } from '../../constants';
import { LayoutDashboard, Users, UserCircle, LogOut, Sun, Moon, Layers, CreditCard, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';

export const Sidebar = () => {
  const { style, mode, toggleMode, toggleStyle } = useTheme();
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Groups', path: '/groups', icon: Layers },
    { label: 'Friends', path: '/friends', icon: Users },
    { label: 'Profile', path: '/profile', icon: UserCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  let containerStyles = "h-full w-full flex flex-col p-6 ";
  if (style === THEMES.NEOBRUTALISM) {
    containerStyles += `border-r-2 border-black ${mode === 'dark' ? 'bg-zinc-900' : 'bg-neo-bg'}`;
  } else {
    containerStyles += "backdrop-blur-xl border-r border-white/10 bg-white/5";
  }

  return (
    <div className={containerStyles}>
      <div className="mb-8">
        <h1 className={`text-3xl font-extrabold flex items-center gap-2 ${style === THEMES.NEOBRUTALISM ? 'font-mono uppercase tracking-tighter' : 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500'}`}>
          <CreditCard className={style === THEMES.NEOBRUTALISM ? 'stroke-[3px]' : ''} />
          Splitwiser
        </h1>
      </div>

      <nav className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => (
          <Link to={item.path} key={item.path}>
            <div className={`flex items-center gap-3 px-4 py-3 transition-all ${
              isActive(item.path) 
                ? (style === THEMES.NEOBRUTALISM 
                    ? 'bg-neo-main text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                    : 'bg-white/20 text-white rounded-xl shadow-lg border border-white/20')
                : 'hover:opacity-70'
            }`}>
              <item.icon size={20} />
              <span className="font-bold">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        {user && (
          <div className={`p-4 flex items-center gap-3 ${style === THEMES.NEOBRUTALISM ? 'border-2 border-black bg-white text-black' : 'rounded-xl bg-black/20 text-white'}`}>
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-white">
                {user.name.charAt(0)}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="font-bold truncate">{user.name}</p>
             </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
           <Button size="sm" variant="secondary" onClick={toggleMode} title="Toggle Dark Mode">
             {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
           </Button>
           <Button size="sm" variant="secondary" onClick={toggleStyle} title="Toggle Theme Style">
             {style === THEMES.NEOBRUTALISM ? 'Glass' : 'Neo'}
           </Button>
        </div>

        <Button variant="danger" onClick={logout} className="w-full">
          <LogOut size={18} />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};

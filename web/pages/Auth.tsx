import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { login as apiLogin, signup as apiSignup } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { THEMES } from '../constants';
import { CreditCard, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { style, toggleStyle } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await apiLogin({ email, password });
      } else {
        res = await apiSignup({ email, password, name });
      }
      
      const { access_token, user } = res.data;
      login(access_token, user);
      navigate('/dashboard');
    } catch (err: any) {
        if (err.response) {
            setError(err.response.data?.detail?.[0]?.msg || "Authentication failed");
        } else {
            setError("Something went wrong");
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
            <h1 className={`text-5xl font-extrabold flex items-center gap-3 ${style === THEMES.NEOBRUTALISM ? 'font-mono uppercase tracking-tighter' : 'text-white drop-shadow-lg'}`}>
              <CreditCard size={48} />
              Splitwiser
            </h1>
        </div>

        <Card className={isLogin ? '' : 'animate-in fade-in slide-in-from-bottom-4'}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="opacity-60 text-sm mt-1">Manage your expenses with style.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <Input 
                placeholder="Full Name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            )}
            <Input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <Input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />

            {error && <div className="p-3 bg-red-100 border border-red-500 text-red-700 text-sm rounded">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)} 
              className={`text-sm font-bold underline underline-offset-2 ${style === THEMES.NEOBRUTALISM ? 'hover:bg-yellow-300' : 'hover:text-blue-300'}`}
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
        </Card>

        <div className="mt-8 text-center">
            <Button variant="ghost" size="sm" onClick={toggleStyle}>
                <Sparkles size={16} /> Try {style === THEMES.NEOBRUTALISM ? 'Glassmorphism' : 'Neobrutalism'}
            </Button>
        </div>
      </div>
    </div>
  );
};

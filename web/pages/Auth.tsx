import { CreditCard, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { THEMES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  login as apiLogin,
  signup as apiSignup,
  loginWithGoogle,
} from '../services/api';
import { signInWithGoogle } from '../services/firebase';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { style, toggleStyle } = useTheme();
  const navigate = useNavigate();

  // Handle Google Sign-In with Firebase
  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      // Get ID token from Firebase Google Sign-In
      const idToken = await signInWithGoogle();
      // Send token to backend for verification
      const res = await loginWithGoogle(idToken);
      const { access_token, user } = res.data;
      login(access_token, user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, not an error
        setError('');
      } else if (err.response) {
        setError(
          err.response.data?.detail || 'Google authentication failed'
        );
      } else {
        setError(err.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

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
        setError(
          err.response.data?.detail?.[0]?.msg || 'Authentication failed'
        );
      } else {
        setError('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <h1
            className={`text-5xl font-extrabold flex items-center gap-3 ${style === THEMES.NEOBRUTALISM ? 'font-mono uppercase tracking-tighter' : 'text-white drop-shadow-lg'}`}
          >
            <CreditCard size={48} />
            Splitwiser
          </h1>
        </div>

        <Card
          className={isLogin ? '' : 'animate-in fade-in slide-in-from-bottom-4'}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="opacity-60 text-sm mt-1">
              Manage your expenses with style.
            </p>
          </div>

          {/* Google Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? 'Signing in...' : isLogin ? 'Sign in with Google' : 'Sign up with Google'}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
            <span className="text-sm opacity-50 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <Input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="p-3 bg-red-100 border border-red-500 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className={`text-sm font-bold underline underline-offset-2 ${style === THEMES.NEOBRUTALISM ? 'hover:bg-yellow-300' : 'hover:text-blue-300'}`}
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Login'}
            </button>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <Button variant="ghost" size="sm" onClick={toggleStyle}>
            <Sparkles size={16} /> Try{' '}
            {style === THEMES.NEOBRUTALISM ? 'Glassmorphism' : 'Neobrutalism'}
          </Button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Groups } from './pages/Groups';
import { GroupDetails } from './pages/GroupDetails';
import { Friends } from './pages/Friends';
import { Layout } from './components/layout/Layout';
import { ThemeWrapper } from './components/layout/ThemeWrapper';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();
    
    return (
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <ThemeWrapper><Auth /></ThemeWrapper> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!isAuthenticated ? <ThemeWrapper><Auth /></ThemeWrapper> : <Navigate to="/dashboard" />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><div className="p-8 text-center text-xl">Profile Management Coming Soon</div></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
    );
}

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
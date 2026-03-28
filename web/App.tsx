import React, { Suspense, lazy } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ThemeWrapper } from './components/layout/ThemeWrapper';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoader } from './components/ui/PageLoader';

// Lazy load pages
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Friends = lazy(() => import('./pages/Friends').then(m => ({ default: m.Friends })));
const GroupDetails = lazy(() => import('./pages/GroupDetails').then(m => ({ default: m.GroupDetails })));
const Groups = lazy(() => import('./pages/Groups').then(m => ({ default: m.Groups })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const SplitwiseCallback = lazy(() => import('./pages/SplitwiseCallback').then(m => ({ default: m.SplitwiseCallback })));
const SplitwiseGroupSelection = lazy(() => import('./pages/SplitwiseGroupSelection').then(m => ({ default: m.SplitwiseGroupSelection })));
const SplitwiseImport = lazy(() => import('./pages/SplitwiseImport').then(m => ({ default: m.SplitwiseImport })));

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <PageLoader />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();
    
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={!isAuthenticated ? <ThemeWrapper><Auth /></ThemeWrapper> : <Navigate to="/dashboard" />} />
              <Route path="/signup" element={!isAuthenticated ? <ThemeWrapper><Auth /></ThemeWrapper> : <Navigate to="/dashboard" />} />

              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
              <Route path="/groups/:id" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
              <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/import/splitwise" element={<ProtectedRoute><SplitwiseImport /></ProtectedRoute>} />
              <Route path="/import/splitwise/select-groups" element={<ProtectedRoute><SplitwiseGroupSelection /></ProtectedRoute>} />
              <Route path="/import/splitwise/callback" element={<ProtectedRoute><SplitwiseCallback /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
            </Routes>
        </Suspense>
    );
}

const App = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <HashRouter>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
                <ToastContainer />
            </HashRouter>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
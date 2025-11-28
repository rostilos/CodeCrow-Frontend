import { Navigate, useLocation } from 'react-router-dom';
import { authUtils } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = authUtils.isAuthenticated();
  const location = useLocation();

  if (!isAuthenticated) {
    // Store the intended destination (full path + search params) before redirecting to login
    const intendedDestination = location.pathname + location.search;
    localStorage.setItem('intendedDestination', intendedDestination);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
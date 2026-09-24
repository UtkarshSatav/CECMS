import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  requireClubLeader?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, requireClubLeader }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireClubLeader) {
    const isLeadership = 
      user.is_club_leader || 
      user.role === 'ADMIN' || 
      user.role === 'SUPER_ADMIN' || 
      user.role === 'ADMINISTRATOR' || 
      user.role === 'CLUB_COORDINATOR';
    if (!isLeadership) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (allowedRoles) {
    const isSuper = user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR';
    const isAdmin = user.role === 'ADMIN' || isSuper;

    let hasAccess = false;
    if (allowedRoles.includes(user.role)) {
      hasAccess = true;
    } else if (allowedRoles.includes('ADMIN') && isAdmin) {
      hasAccess = true;
    } else if (allowedRoles.includes('SUPER_ADMIN') && isSuper) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

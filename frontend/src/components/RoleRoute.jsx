import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * RoleRoute enforces role-based access control on frontend routes.
 * @param {Array<string>} allowedRoles - Authorized roles e.g. ['admin'], ['seller', 'admin'], or empty for any authenticated user
 * @param {React.ReactNode} children - Component/layout to render when authorized
 */
export default function RoleRoute({ allowedRoles = [], children }) {
  const { user, token, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        color: 'var(--text-muted)',
        fontSize: '0.95rem'
      }}>
        Verifying credentials...
      </div>
    );
  }

  // Not authenticated -> redirect to login with return path
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role verification check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If user's role is not allowed on this path, redirect them to their home workspace
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

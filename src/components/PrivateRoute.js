import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const PrivateRoute = ({ children, allow = [] }) => {
  const { isAuthenticated, roles, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <div style={{textAlign:'center',marginTop:40}}>Loading...</div>;
  
  // Check if authenticated (token is in HTTP-only cookie, validated by backend)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allow.length > 0) {
    const lower = roles.map(r => r.toLowerCase());
    const ok = allow.some(r => lower.includes(r.toLowerCase()));
    if (!ok) return <Navigate to="/" replace />;
  }
  return children;
};

export default PrivateRoute;
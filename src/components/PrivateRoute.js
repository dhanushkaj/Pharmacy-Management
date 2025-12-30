import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const PrivateRoute = ({ children, allow = [] }) => {
  const { token, roles, loading } = useContext(AuthContext);
  if (loading) return <div style={{textAlign:'center',marginTop:40}}>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;

  if (allow.length > 0) {
    const lower = roles.map(r => r.toLowerCase());
    const ok = allow.some(r => lower.includes(r.toLowerCase()));
    if (!ok) return <Navigate to="/" replace />;
  }
  return children;
};

export default PrivateRoute;
// AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [roles, setRoles] = useState([]);    // array
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const r = localStorage.getItem('roles');     // stored as JSON string or plain string
    const u = localStorage.getItem('username');
    if (t) setToken(t);
    if (r) {
      try {
        const parsed = JSON.parse(r);
        setRoles(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (e) {
        // fallback: treat as single role string
        setRoles([r]);
      }
    }
    if (u) setUsername(u);
  }, []);

  const login = (token, rolesArr = [], user = null) => {
    const normalizedRoles = Array.isArray(rolesArr) ? rolesArr : [rolesArr];
    setToken(token);
    setRoles(normalizedRoles);
    setUsername(user);
    localStorage.setItem('token', token);
    localStorage.setItem('roles', JSON.stringify(normalizedRoles));
    if (user) localStorage.setItem('username', user);
    console.log(token);
  };

  const logout = () => {
    setToken(null);
    setRoles([]);
    setUsername(null);
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    localStorage.removeItem('username');
  };

  const hasRole = (role) => {
    if (!role) return false;
    if (!roles) return false;
    if (Array.isArray(roles)) {
      return roles.map(r => String(r).toLowerCase()).includes(role.toLowerCase());
    }
    return String(roles).toLowerCase() === role.toLowerCase();
  };

  return (
    <AuthContext.Provider value={{ token, roles, username, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

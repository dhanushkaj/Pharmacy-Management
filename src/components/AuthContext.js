// AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [roles, setRoles] = useState([]);    // array
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const r = localStorage.getItem('roles');     // stored as JSON string
    const u = localStorage.getItem('username');
    if (t) setToken(t);
    if (r) setRoles(JSON.parse(r));
    if (u) setUsername(u);
  }, []);

  const login = (token, rolesArr = [], user = null) => {
    setToken(token);
    setRoles(rolesArr);
    setUsername(user);
    localStorage.setItem('token', token);
    localStorage.setItem('roles', JSON.stringify(rolesArr));
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

  const hasRole = (role) => roles.map(r => r.toLowerCase()).includes(role.toLowerCase());

  return (
    <AuthContext.Provider value={{ token, roles, username, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

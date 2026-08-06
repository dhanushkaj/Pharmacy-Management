// AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiLogout, apiValidateToken, apiRefreshToken, apiSwitchUserByCode } from '../utill/api';

export const AuthContext = createContext();

// Inactivity timeout in milliseconds (30 minutes = 30 * 60 * 1000)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
// Warning before logout (show warning 2 minutes before timeout)
const WARNING_BEFORE_TIMEOUT = 2 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  // Note: We no longer store token in state - it's in HTTP-only cookie
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState([]);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  // Refs for timers
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const logout = useCallback(async (reason = '') => {
    // Call backend to clear HTTP-only cookie
    await apiLogout();
    
    setIsAuthenticated(false);
    setRoles([]);
    setUsername(null);
    setShowInactivityWarning(false);
    
    // Clear all timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    if (reason) {
      console.log('Logout reason: ' + reason);
    }
  }, []);

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;
    
    lastActivityRef.current = Date.now();
    localStorage.setItem('lastActivity', Date.now().toString());
    setShowInactivityWarning(false);
    
    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Set warning timer (fires 2 minutes before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowInactivityWarning(true);
      setRemainingTime(WARNING_BEFORE_TIMEOUT / 1000);
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_TIMEOUT);
    
    // Set logout timer
    inactivityTimerRef.current = setTimeout(async () => {
      console.log('Inactivity timeout - logging out...');
      await logout('Inactivity timeout');
      window.location.href = '/login?reason=inactivity';
    }, INACTIVITY_TIMEOUT);
  }, [isAuthenticated, logout]);

  // Extend session (called from warning modal)
  const extendSession = useCallback(async () => {
    setShowInactivityWarning(false);
    
    // Refresh the token on the backend to extend session
    const success = await apiRefreshToken();
    if (success) {
      resetInactivityTimer();
    } else {
      // Token refresh failed, logout
      await logout('Token refresh failed');
      window.location.href = '/login';
    }
  }, [resetInactivityTimer, logout]);

  // Validate token with backend
  const validateToken = useCallback(async () => {
    const result = await apiValidateToken();
    if (!result.valid) {
      await logout('Token validation failed');
      return false;
    }
    return true;
  }, [logout]);

  // Setup activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttle activity detection to avoid excessive timer resets
    let lastReset = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      // Only reset if more than 1 second since last reset
      if (now - lastReset > 1000) {
        lastReset = now;
        resetInactivityTimer();
      }
    };
    
    // Add listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Initial timer setup
    resetInactivityTimer();
    
    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // Check last activity on page load/focus (for when user returns to tab)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkLastActivity = async () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
        if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
          console.log('Session expired due to inactivity while away');
          await logout('Inactivity while away');
          window.location.href = '/login?reason=inactivity';
        }
      }
    };
    
    // Check on visibility change (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkLastActivity();
      }
    };
    
    // Check on window focus
    const handleFocus = () => {
      checkLastActivity();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, logout]);

  // Initial load - validate token with backend
  useEffect(() => {
    const initAuth = async () => {
      // Check if we have stored auth info
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedRoles = localStorage.getItem('roles');
      const storedUsername = localStorage.getItem('username');
      
      if (storedAuth === 'true') {
        // Check inactivity timeout first
        const lastActivity = localStorage.getItem('lastActivity');
        if (lastActivity) {
          const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
          if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
            // Session expired due to inactivity
            await logout('Inactivity on page load');
            setLoading(false);
            return;
          }
        }
        
        // Validate token with backend
        const result = await apiValidateToken();
        if (result.valid) {
          setIsAuthenticated(true);
          setRoles(result.roles || []);
          setUsername(result.username || storedUsername);
          // Update stored values
          localStorage.setItem('roles', JSON.stringify(result.roles || []));
          localStorage.setItem('username', result.username || '');
        } else {
          // Token invalid, clear local storage
          await logout('Invalid token on page load');
        }
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, [logout]);

  // Listen for storage changes (logout in other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'isAuthenticated' && e.newValue !== 'true') {
        setIsAuthenticated(false);
        setRoles([]);
        setUsername(null);
        window.location.href = '/login';
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (rolesArr = [], user = null) => {
    const normalizedRoles = Array.isArray(rolesArr) ? rolesArr : [rolesArr];
    setIsAuthenticated(true);
    setRoles(normalizedRoles);
    setUsername(user);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('roles', JSON.stringify(normalizedRoles));
    localStorage.setItem('lastActivity', Date.now().toString());
    if (user) localStorage.setItem('username', user);
  };

  const hasRole = (role) => {
    if (!role) return false;
    if (!roles) return false;
    if (Array.isArray(roles)) {
      return roles.map(r => String(r).toLowerCase()).includes(role.toLowerCase());
    }
    return String(roles).toLowerCase() === role.toLowerCase();
  };

  // Format remaining time for display
  const formatRemainingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + secs.toString().padStart(2, '0');
  };

  const switchUserByCode = useCallback(async (sessionCode) => {
    try {
      const response = await apiSwitchUserByCode(sessionCode);
      if (response && response.username) {
        // Update local storage and state with new user
        const roles = response.roles || [];
        setIsAuthenticated(true);
        setRoles(roles);
        setUsername(response.username);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('roles', JSON.stringify(roles));
        localStorage.setItem('username', response.username);
        localStorage.setItem('lastActivity', Date.now().toString());
        
        // Reset inactivity timer for new session
        resetInactivityTimer();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to switch user:', error);
      throw error;
    }
  }, [resetInactivityTimer]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated,
      roles, 
      username, 
      login, 
      logout, 
      hasRole, 
      loading,
      validateToken,
      extendSession,
      switchUserByCode,
      showInactivityWarning,
      remainingTime
    }}>
      {children}
      
      {/* Inactivity Warning Modal */}
      {showInactivityWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: '#fff',
            padding: 32,
            borderRadius: 12,
            maxWidth: 400,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
            <h2 style={{ margin: '0 0 16px', color: '#d32f2f' }}>Session Expiring Soon</h2>
            <p style={{ color: '#666', marginBottom: 8 }}>
              You have been inactive for a while.
            </p>
            <p style={{ color: '#666', marginBottom: 24 }}>
              Your session will expire in:
            </p>
            <div style={{
              fontSize: 36,
              fontWeight: 'bold',
              color: remainingTime <= 60 ? '#d32f2f' : '#ff9800',
              marginBottom: 24
            }}>
              {formatRemainingTime(remainingTime)}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={extendSession}
                style={{
                  padding: '12px 32px',
                  background: '#4caf50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Stay Logged In
              </button>
              <button
                onClick={async () => {
                  await logout('User chose to logout');
                  window.location.href = '/login';
                }}
                style={{
                  padding: '12px 32px',
                  background: '#f5f5f5',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 16,
                  cursor: 'pointer'
                }}
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

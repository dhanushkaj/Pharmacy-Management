import { useEffect, useState, useCallback } from 'react';
import { Modal, Button } from 'antd';
import { api } from '../utill/api';
import './SessionTimeoutMonitor.css';

/**
 * SessionTimeoutMonitor - Monitors JWT token expiration and shows warning popup
 * When token is about to expire (1 minute remaining):
 * - Shows modal asking if user wants to stay logged in
 * - YES: Refreshes token for another 1 hour
 * - NO or timeout: Logs user out automatically
 */
const SessionTimeoutMonitor = ({ onLogout }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [tokenExpiration, setTokenExpiration] = useState(null);
  const [warningTime, setWarningTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Interval references for cleanup
  const checkIntervalRef = useCallback((intervalId) => {
    if (intervalId) clearInterval(intervalId);
  }, []);

  // Refresh token on YES
  const handleStayLoggedIn = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await api.post('/auth/refresh');
      if (response.data?.success) {
        setShowWarning(false);
        // Token has been refreshed, restart monitoring
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    } finally {
      setIsRefreshing(false);
    }
    return false;
  }, []);

  // Logout on NO
  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    onLogout?.();
  }, [onLogout]);

  // Auto-logout if modal times out (user doesn't respond)
  const handleModalCancel = useCallback(() => {
    setShowWarning(false);
    handleLogout();
  }, [handleLogout]);

  // Check token expiration periodically
  useEffect(() => {
    const checkTokenExpiration = async () => {
      try {
        const response = await api.get('/auth/token-info');
        if (response.data?.success) {
          const { timeRemaining, warningTimeMs, expirationTime } = response.data;
          setTokenExpiration(expirationTime);
          setWarningTime(warningTimeMs);

          // If warning time threshold reached and modal not already showing
          if (timeRemaining <= warningTimeMs && !showWarning) {
            setTimeRemaining(Math.ceil(timeRemaining / 1000)); // Convert to seconds
            setShowWarning(true);
            
            // Auto-logout after 2 minutes of inactivity (if modal still open)
            const autoLogoutTimer = setTimeout(() => {
              if (showWarning) {
                handleLogout();
              }
            }, 2 * 60 * 1000);

            return () => clearTimeout(autoLogoutTimer);
          }
        }
      } catch (error) {
        // Token likely expired or invalid
        if (error.response?.status === 401) {
          console.warn('Token validation failed, logging out');
          onLogout?.();
        }
      }
    };

    // Check token every 10 seconds
    const intervalId = setInterval(checkTokenExpiration, 10000);
    
    // Initial check
    checkTokenExpiration();

    return () => clearInterval(intervalId);
  }, [showWarning, onLogout]);

  // Update countdown when warning modal is shown
  useEffect(() => {
    if (!showWarning) return;

    const countdownInterval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(countdownInterval);
          handleLogout();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showWarning, handleLogout]);

  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      title="Session Expiration Warning"
      open={showWarning}
      onCancel={handleModalCancel}
      width={420}
      centered
      closable={false}
      maskClosable={false}
      footer={null}
      className="session-timeout-modal"
    >
      <div className="session-timeout-content">
        <div className="warning-icon">⏰</div>
        
        <p className="warning-message">
          Your session will expire in <strong>{formatTimeRemaining(timeRemaining)}</strong>
        </p>
        
        <p className="warning-description">
          Do you want to stay logged in? Your session will be extended for another hour.
        </p>

        <div className="session-timeout-progress">
          <div 
            className="progress-bar"
            style={{
              width: `${(timeRemaining / 120) * 100}%`,
              animation: 'shrink 1s linear infinite'
            }}
          />
        </div>

        <div className="session-timeout-buttons">
          <Button
            type="primary"
            size="large"
            onClick={handleStayLoggedIn}
            loading={isRefreshing}
            danger={false}
            className="btn-stay-logged-in"
          >
            Yes, Keep Me Logged In
          </Button>
          
          <Button
            size="large"
            onClick={handleLogout}
            danger
            className="btn-logout"
          >
            No, Logout
          </Button>
        </div>

        <p className="auto-logout-warning">
          Auto-logout in {formatTimeRemaining(timeRemaining)} if no action taken
        </p>
      </div>
    </Modal>
  );
};

export default SessionTimeoutMonitor;

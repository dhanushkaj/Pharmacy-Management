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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh token on YES
  const handleStayLoggedIn = useCallback(async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Attempting to refresh token...');
      const response = await api('/api/auth/refresh', { method: 'POST' });
      console.log('📡 Refresh response:', response);
      if (response?.success) {
        setShowWarning(false);
        setTimeRemaining(60); // Reset countdown
        console.log('✅ Token refreshed successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
    } finally {
      setIsRefreshing(false);
    }
    return false;
  }, []);

  // Logout on NO
  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    try {
      console.log('🚪 Logging out...');
      await api('/api/auth/logout', { method: 'POST' });
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
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
        console.log('🔍 Checking token expiration...');
        const response = await api('/api/auth/token-info', { method: 'GET' });
        console.log('📡 Token info response:', response);
        
        if (response?.success) {
          const { timeRemaining: msRemaining, warningTimeMs, expirationDurationMs, currentTime, expirationTime } = response;
          
          console.log(`⏱️  Token check - Remaining: ${msRemaining}ms (${(msRemaining/1000).toFixed(1)}s), Warning threshold: ${warningTimeMs}ms`);
          console.log(`📊 Token duration: ${expirationDurationMs}ms, Current: ${currentTime}, Expires: ${expirationTime}`);

          // If within warning window and not already showing warning
          if (msRemaining > 0 && msRemaining <= warningTimeMs && !showWarning) {
            const secondsRemaining = Math.ceil(msRemaining / 1000);
            console.log(`🚨 SESSION TIMEOUT WARNING TRIGGERED! Showing popup with ${secondsRemaining} seconds remaining`);
            setTimeRemaining(secondsRemaining);
            setShowWarning(true);
          } else if (msRemaining <= 0) {
            console.warn('⚠️ Token already expired, logging out');
            handleLogout();
          }
        } else {
          console.error('❌ Token info response invalid:', response);
        }
      } catch (error) {
        console.error('❌ Error checking token:', error);
        // Token likely expired or invalid
        if (error.message?.includes('401') || error.message?.includes('Session expired')) {
          console.warn('🔐 Token validation failed (401), logging out');
          handleLogout();
        }
      }
    };

    console.log('✅ SessionTimeoutMonitor mounted, starting token checks every 5 seconds');
    // Check token every 5 seconds for better coverage
    const intervalId = setInterval(checkTokenExpiration, 5000);
    
    // Initial check immediately
    checkTokenExpiration();

    return () => {
      console.log('🛑 SessionTimeoutMonitor unmounting, clearing interval');
      clearInterval(intervalId);
    };
  }, []); // Empty dependency - only run once on mount

  // Update countdown when warning modal is shown
  useEffect(() => {
    if (!showWarning) return;

    const countdownInterval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(countdownInterval);
          console.log('Session countdown reached zero, auto-logging out');
          setShowWarning(false);
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

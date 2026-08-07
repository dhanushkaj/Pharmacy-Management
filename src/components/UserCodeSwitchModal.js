import React, { useState, useEffect } from 'react';
import { api } from '../utill/api';

const UserCodeSwitchModal = ({ isOpen, onClose, onSwitchSuccess }) => {
  const [sessionCode, setSessionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    setLoading(true);
    try {
      const response = await api('/api/auth/switch-user', {
        method: 'POST',
        body: { sessionCode }
      });
      
      if (response && response.username) {
        setSuccess(`Switched to user: ${response.username}`);
        setSessionCode('');
        
        // Call the callback to refresh the app
        setTimeout(() => {
          if (onSwitchSuccess) {
            onSwitchSuccess(response.username, response.roles);
          }
          // Refresh the page to update all components
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Failed to switch user. Please check the code and try again.');
      console.error('Switch user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSessionCode('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 8,
        padding: 24,
        maxWidth: 400,
        width: '90%',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Switch User Session</h2>
        
        {success ? (
          <div style={{ 
            color: 'green', 
            padding: 12, 
            background: '#e8f5e9',
            borderRadius: 4,
            marginBottom: 16
          }}>
            ✓ {success}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Enter Session Code:
              </label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  // Allow only numbers and control keys
                  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                placeholder="e.g., 157656"
                disabled={loading}
                autoFocus
                maxLength="6"
                style={{
                  width: '100%',
                  padding: 10,
                  fontSize: 16,
                  letterSpacing: '2px',
                  border: error ? '2px solid #d32f2f' : '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              />
              {error && (
                <div style={{ color: '#d32f2f', fontSize: 12, marginTop: 8 }}>
                  ⚠ {error}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '8px 24px',
                  background: loading ? '#ccc' : '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Switching...' : 'Switch User'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserCodeSwitchModal;

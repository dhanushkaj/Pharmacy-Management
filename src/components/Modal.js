import React from 'react';

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      }}>
        <h3>{title}</h3>
        {children}
        <button style={{ marginTop: 24 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Modal;
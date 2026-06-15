import React from 'react';

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, boxSizing: 'border-box', zIndex: 1000
    }}>
      <div style={{
        background: '#fff', padding: 24, borderRadius: 8, minWidth: 280, maxWidth: '90vw', maxHeight: '85vh',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)', overflowY: 'auto', boxSizing: 'border-box'
      }}>
        <h3 style={{ marginTop: 0, fontSize: 18 }}>{title}</h3>
        {children}
        <button style={{ marginTop: 20 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Modal;
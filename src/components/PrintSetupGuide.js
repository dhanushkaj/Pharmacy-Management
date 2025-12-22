import React, { useState } from 'react';

export default function PrintSetupGuide() {
  const [isOpen, setIsOpen] = useState(false);
  
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0;
  const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0;

  const getOSName = () => {
    if (isMac) return 'macOS';
    if (isWindows) return 'Windows';
    if (isLinux) return 'Linux';
    return 'Your Operating System';
  };

  const setupSteps = isMac ? [
    'Open System Settings → Printers & Scanners',
    'Select your thermal printer (e.g., EPSON TM-T20, Star TSP100)',
    'Click "Set as Default Printer"',
    'Click "Options & Supplies" → Paper Size → Select "80mm Receipt" or "Receipt"',
    'Close System Settings',
    'Restart the pharmacy app for changes to take effect'
  ] : isWindows ? [
    'Open Settings → Devices → Printers & Scanners',
    'Select your thermal printer (e.g., EPSON TM-T20, Star TSP100)',
    'Click "Manage" → "Set as default"',
    'Click "Printing preferences" → Paper Size → Select "80mm Receipt" or "Receipt"',
    'Save and close Settings',
    'Restart the pharmacy app for changes to take effect'
  ] : [
    'Open System Settings → Printers',
    'Select your thermal printer and set as default',
    'Configure paper size to 80mm in printer properties',
    'Save settings',
    'Restart the pharmacy app for changes to take effect'
  ];

  const kioskModeSteps = isMac ? [
    'Close this browser window',
    'Navigate to: /Users/[YourUsername]/Documents/pharmacy/New_Pharmacy_Project/',
    'Double-click "start-pharmacy-mac.command"',
    'If prompted, allow execution in Security & Privacy settings',
    'The app will launch in kiosk mode with auto-printing enabled'
  ] : isWindows ? [
    'Close this browser window',
    'Navigate to: C:\\...\\pharmacy\\New_Pharmacy_Project\\',
    'Double-click "start-pharmacy-windows.bat"',
    'The app will launch in kiosk mode with auto-printing enabled'
  ] : [
    'Close this browser window',
    'Open terminal in pharmacy project folder',
    'Run: google-chrome --kiosk --kiosk-printing --app=http://localhost:3000',
    'The app will launch in kiosk mode with auto-printing enabled'
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          backgroundColor: '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 1000
        }}
      >
        🖨️ Printer Setup Guide
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
            🖨️ Thermal Printer Setup Guide
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#999',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <div style={{
            backgroundColor: '#e6f7ff',
            border: '1px solid #91d5ff',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '20px'
          }}>
            <strong>Detected OS:</strong> {getOSName()}
          </div>

          <h3 style={{ color: '#1890ff', fontSize: '18px', marginBottom: '15px' }}>
            📋 Step 1: Configure Default Printer
          </h3>
          <ol style={{ paddingLeft: '20px', color: '#555', lineHeight: '1.8' }}>
            {setupSteps.map((step, idx) => (
              <li key={idx} style={{ marginBottom: '8px' }}>{step}</li>
            ))}
          </ol>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#52c41a', fontSize: '18px', marginBottom: '15px' }}>
            🚀 Step 2: Enable Auto-Print Mode (Optional but Recommended)
          </h3>
          <p style={{ color: '#666', marginBottom: '15px', lineHeight: '1.6' }}>
            For <strong>one-click printing without dialogs</strong>, launch the app in kiosk mode:
          </p>
          <ol style={{ paddingLeft: '20px', color: '#555', lineHeight: '1.8' }}>
            {kioskModeSteps.map((step, idx) => (
              <li key={idx} style={{ marginBottom: '8px' }}>{step}</li>
            ))}
          </ol>
        </div>

        <div style={{
          backgroundColor: '#fff7e6',
          border: '1px solid #ffd591',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <strong style={{ color: '#d48806' }}>💡 Pro Tip:</strong>
          <p style={{ margin: '8px 0 0 0', color: '#666', lineHeight: '1.6' }}>
            In kiosk mode, bills will print automatically to your default thermal printer 
            without showing the print dialog. Perfect for busy pharmacies!
          </p>
        </div>

        <div style={{
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: '6px',
          padding: '16px'
        }}>
          <strong style={{ color: '#52c41a' }}>✅ Test Your Setup:</strong>
          <p style={{ margin: '8px 0 0 0', color: '#666', lineHeight: '1.6' }}>
            1. Create a test billing<br />
            2. Click "Print & Close"<br />
            3. Bill should print on thermal printer automatically (kiosk mode) or after selecting printer (normal mode)
          </p>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              padding: '12px 32px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Print Helper for Thermal Printer
 * Provides minimal-setup printing functionality
 */

/**
 * Quick print with minimal dialogs
 * Works best when:
 * - Thermal printer is set as default printer
 * - Paper size is pre-configured to 80mm
 * - App is running in Chrome kiosk mode (--kiosk-printing flag)
 */
export const quickPrint = () => {
  window.print();
};

/**
 * Auto-print after delay (for kiosk mode)
 * Useful for automatic printing after bill creation
 */
export const autoPrint = (delayMs = 500) => {
  setTimeout(() => {
    window.print();
  }, delayMs);
};

/**
 * Check if running in kiosk/silent print mode
 */
export const isKioskMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches;
};

/**
 * Print with confirmation (for non-kiosk mode)
 */
export const printWithConfirm = (message = 'Print this bill?') => {
  if (window.confirm(message)) {
    window.print();
    return true;
  }
  return false;
};

/**
 * Configure print settings hint for users
 */
export const getPrintSetupInstructions = () => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0;
  
  if (isMac) {
    return {
      os: 'macOS',
      steps: [
        '1. Open System Settings → Printers & Scanners',
        '2. Select your thermal printer (e.g., EPSON TM-T20)',
        '3. Click "Set as Default Printer"',
        '4. Click "Options & Supplies" → Paper Size → Select "80mm Receipt"',
        '5. Close and restart the pharmacy app',
        '6. Optional: Launch Chrome with: chrome --kiosk-printing --app=http://localhost:3000'
      ]
    };
  } else if (isWindows) {
    return {
      os: 'Windows',
      steps: [
        '1. Open Settings → Devices → Printers & Scanners',
        '2. Select your thermal printer (e.g., EPSON TM-T20)',
        '3. Click "Manage" → "Set as default"',
        '4. Click "Printing preferences" → Paper Size → Select "80mm Receipt"',
        '5. Close and restart the pharmacy app',
        '6. Optional: Create shortcut with: chrome.exe --kiosk-printing --app=http://localhost:3000'
      ]
    };
  } else {
    return {
      os: 'Linux',
      steps: [
        '1. Open System Settings → Printers',
        '2. Select your thermal printer and set as default',
        '3. Configure paper size to 80mm in printer properties',
        '4. Restart the pharmacy app',
        '5. Optional: Launch with: google-chrome --kiosk-printing --app=http://localhost:3000'
      ]
    };
  }
};

/**
 * Show setup guide modal (can be used in your app)
 */
export const showPrintSetupGuide = () => {
  const guide = getPrintSetupInstructions();
  console.log('=== Thermal Printer Setup Guide ===');
  console.log(`Operating System: ${guide.os}`);
  console.log('\nSetup Steps:');
  guide.steps.forEach(step => console.log(step));
  console.log('\n=== End of Guide ===');
  return guide;
};

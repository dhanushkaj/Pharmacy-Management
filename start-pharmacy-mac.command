#!/bin/bash
# =====================================================
# Pharmacy App - macOS Kiosk Mode Launcher
# Auto-prints bills without showing print dialog
# =====================================================

echo "Starting Pharmacy App in Kiosk Mode..."
echo ""
echo "NOTE: Bills will print automatically to your default printer!"
echo "To exit kiosk mode, press Cmd+Q"
echo ""

# Check if Chrome is installed
if [ -d "/Applications/Google Chrome.app" ]; then
    echo "Launching with Google Chrome..."
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
        --kiosk \
        --kiosk-printing \
        --disable-print-preview \
        --app=http://localhost:3000
else
    echo ""
    echo "ERROR: Google Chrome not found!"
    echo "Please install Google Chrome from: https://www.google.com/chrome/"
    echo ""
    echo "Alternatively, you can manually run this command:"
    echo '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk --kiosk-printing --app=http://localhost:3000'
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo ""
echo "Pharmacy app started in kiosk mode!"

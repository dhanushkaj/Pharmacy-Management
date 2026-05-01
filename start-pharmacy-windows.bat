@echo off
REM =====================================================
REM Pharmacy App - Windows Kiosk Mode Launcher
REM Auto-prints bills without showing print dialog
REM =====================================================

echo Starting Pharmacy App in Kiosk Mode...
echo.
echo NOTE: Bills will print automatically to your default printer!
echo To exit kiosk mode, press Alt+F4
echo.

REM Check if Chrome is installed in common locations
set CHROME_PATH=

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

REM Check if Edge is installed (alternative)
set EDGE_PATH=
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set EDGE_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

if defined CHROME_PATH (
    echo Launching with Google Chrome...
    start "" %CHROME_PATH% --kiosk --kiosk-printing --disable-print-preview --app=http://localhost:3000
) else if defined EDGE_PATH (
    echo Chrome not found. Launching with Microsoft Edge...
    start "" %EDGE_PATH% --kiosk --kiosk-printing --disable-print-preview --app=http://localhost:3000
) else (
    echo.
    echo ERROR: Neither Google Chrome nor Microsoft Edge was found!
    echo Please install Google Chrome from: https://www.google.com/chrome/
    echo.
    echo Alternatively, you can manually run this command in your browser's executable folder:
    echo chrome.exe --kiosk --kiosk-printing --app=http://localhost:3000
    echo.
    pause
    exit /b 1
)

echo.
echo Pharmacy app started in kiosk mode!

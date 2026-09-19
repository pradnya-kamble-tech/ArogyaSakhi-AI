@echo off
SETLOCAL EnableDelayedExpansion

:: Healthcare DSS - Fully Furbished Startup Script
:: Version: 2.1.0

cls
echo =======================================================
echo    🏥 Healthcare Decision Support System (DSS)
echo =======================================================
echo.

:: 1. Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Install dependencies if node_modules missing
if not exist "node_modules\" (
    echo [INIT] node_modules not found. Installing dependencies...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: 3. Run Backend Diagnostics
echo [TEST] Running system health checks...
node backend/run-all-tests.js
if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARNING] Some system tests failed. 
    echo The system may still run, but check logs for details.
    echo.
    set /p "choice=Do you want to continue anyway? (Y/N): "
    if /i "!choice!" neq "Y" exit /b 1
)

:: 4. Start Server
echo.
echo [START] Launching Healthcare DSS Server...
echo [INFO] Access the application at: http://localhost:5000
echo [INFO] Press Ctrl+C to stop the server.
echo.

node backend/server.js

pause

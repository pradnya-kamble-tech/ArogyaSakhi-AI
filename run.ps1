# Healthcare DSS - Fully Furbished PowerShell Startup Script
# Version: 2.1.0

Clear-Host
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   🏥 Healthcare Decision Support System (DSS)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check for Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

# 2. Install dependencies if node_modules missing
if (!(Test-Path "node_modules")) {
    Write-Host "[INIT] node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# 3. Run Backend Diagnostics
Write-Host "[TEST] Running system health checks..." -ForegroundColor Yellow
node backend/run-all-tests.js
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[WARNING] Some system tests failed." -ForegroundColor Yellow
    Write-Host "The system may still run, but check logs for details."
    $choice = Read-Host "Do you want to continue anyway? (Y/N)"
    if ($choice -ne "Y") { exit 1 }
}

# 4. Start Server
Write-Host ""
Write-Host "[START] Launching Healthcare DSS Server..." -ForegroundColor Green
Write-Host "[INFO] Access the application at: http://localhost:5000"
Write-Host "[INFO] Press Ctrl+C to stop the server."
Write-Host ""

node backend/server.js

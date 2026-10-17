# OneSensor Startup Script for PowerShell
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "       Starting OneSensor Services         " -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "desktop\backend"
$frontendDir = Join-Path $scriptDir "desktop\frontend"

Write-Host "[1/2] Starting Backend Sidecar on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process -FilePath "python" -ArgumentList "app.py" -WorkingDirectory $backendDir

Write-Host "[2/2] Starting Desktop Frontend on http://localhost:3000 ..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $frontendDir

Write-Host ""
Write-Host "OneSensor is running!" -ForegroundColor Yellow
Write-Host " - Desktop App UI : http://localhost:3000" -ForegroundColor White
Write-Host " - Backend API/WS : http://127.0.0.1:8000" -ForegroundColor White

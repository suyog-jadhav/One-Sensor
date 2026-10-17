@echo off
setlocal
echo ===========================================
echo        Starting OneSensor Services         
echo ===========================================

cd /d "%~dp0desktop\backend"
echo [1/2] Starting Backend Sidecar on http://127.0.0.1:8000 ...
start "OneSensor Backend" python app.py

cd /d "%~dp0desktop\frontend"
echo [2/2] Starting Desktop Frontend on http://localhost:3000 ...
start "OneSensor Frontend" npm run dev

echo.
echo OneSensor is running!
echo  - Desktop App UI : http://localhost:3000
echo  - Backend API/WS : http://127.0.0.1:8000
echo.
echo Press any key to exit this launcher window...
pause

@echo off
title ProfitPanel Dev Servers
echo.
echo  ========================================
echo   ProfitPanel - Starting Dev Servers
echo  ========================================
echo.

:: Kill any existing processes on common dev ports
echo  Cleaning up stale processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000.*LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173.*LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5174.*LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5175.*LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo  [1/2] Starting Django backend on http://localhost:8000 ...
cd /d "%~dp0backend"
start "Django Backend" cmd /k "venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

echo  [2/2] Starting Vite frontend on http://localhost:5173 ...
cd /d "%~dp0frontend"
start "Vite Frontend" cmd /k "npx vite --port 5173 --strictPort"

timeout /t 4 /nobreak >nul

echo.
echo  ----------------------------------------
echo   Both servers are running!
echo.
echo   Frontend:  http://localhost:5173/ProfitPanel/
echo   Backend:   http://localhost:8000/api/quotes/
echo  ----------------------------------------
echo.

start http://localhost:5173/ProfitPanel/

echo  Press any key to close this window.
echo  (The servers will keep running in their own windows.)
pause >nul

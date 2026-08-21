@echo off
setlocal
cd /d "%~dp0"

echo Stopping existing processes on 8787 and 5174...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8787" ^| findstr "LISTENING"') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5174" ^| findstr "LISTENING"') do taskkill /PID %%a /F 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend (port 8787)...
start "DnD Backend" cmd /k "cd /d ""%~dp0"" && node server/index.js"

echo Starting frontend (port 5174)...
start "DnD Frontend" cmd /k "cd /d ""%~dp0web"" && npm run dev -- --host 0.0.0.0 --port 5174"

echo Done. Two windows opened: Backend ^(8787^), Frontend ^(5174^).
echo Open http://localhost:5174/#/dm or http://localhost:5174/#/player
pause


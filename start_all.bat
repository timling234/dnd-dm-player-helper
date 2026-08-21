@echo off
setlocal
cd /d "%~dp0"

echo Starting BACKEND...
start "BACKEND" cmd /k "cd /d ""%~dp0"" && node server/index.js"

echo Starting FRONTEND...
start "FRONTEND" cmd /k "cd /d ""%~dp0web"" && npm run dev -- --host 0.0.0.0 --port 5174"

set CF_PATH=%ProgramFiles(x86)%\cloudflared\cloudflared.exe

if exist "%CF_PATH%" (
set CF_CMD="%CF_PATH%"
) else (
where cloudflared >nul 2>nul
if %errorlevel%==0 (
set CF_CMD=cloudflared
) else (
echo ERROR: cloudflared not found.
echo Install from:
echo https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation
pause
exit /b 1
)
)

echo Starting TUNNEL...
start "TUNNEL" cmd /k "cd /d ""%~dp0"" && %CF_CMD% tunnel run dmhelper"

echo Done. Keep the TUNNEL window open.
echo DM: http://localhost:5174/#/dm
echo Player: http://localhost:5174/#/player
pause



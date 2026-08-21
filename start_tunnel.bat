@echo off
setlocal
cd /d "%~dp0"

set "CLOUDFLARED=cloudflared"

where cloudflared >nul 2>nul
if %errorlevel%==0 goto run

REM Common install paths
if exist "C:\Program Files\Cloudflare\cloudflared\cloudflared.exe" set "CLOUDFLARED=C:\Program Files\Cloudflare\cloudflared\cloudflared.exe"
if exist "C:\Program Files (x86)\Cloudflare\cloudflared\cloudflared.exe" set "CLOUDFLARED=C:\Program Files (x86)\Cloudflare\cloudflared\cloudflared.exe"
if exist "%LOCALAPPDATA%\Programs\cloudflared\cloudflared.exe" set "CLOUDFLARED=%LOCALAPPDATA%\Programs\cloudflared\cloudflared.exe"

if "%CLOUDFLARED%"=="cloudflared" (
  echo ERROR: cloudflared not found in PATH.
  echo Run tools\cloudflared_fix.ps1 once, then open a NEW terminal and try again.
  exit /b 1
)

:run
echo Starting Cloudflare Tunnel (trycloudflare) to http://localhost:5174 ...
"%CLOUDFLARED%" tunnel --url http://localhost:5174



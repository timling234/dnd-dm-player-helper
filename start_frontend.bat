@echo off
setlocal
cd /d "%~dp0web"
npm run dev -- --host 0.0.0.0 --port 5174



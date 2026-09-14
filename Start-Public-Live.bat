@echo off
title Edge TTS Platform - UMAIR ASHIQ
cd /d "d:\tts voice"

echo ====================================================
echo Starting Edge TTS Platform - UMAIR ASHIQ
echo ====================================================
echo.

:: Kill any existing hanging node processes on port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

:: Start local backend + frontend server
start "TTS Server" /b node server/dist/index.js
timeout /t 3 /nobreak >nul

echo Server is running on port 5000!
echo.
echo ====================================================
echo Starting Cloudflare Public Global Tunnel...
echo The public link will appear below:
echo ====================================================
echo.

"d:\tts voice\cloudflared.exe" tunnel --url http://localhost:5000
pause

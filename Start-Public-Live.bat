@echo off
title Edge TTS Platform - UMAIR ASHIQ
cd /d "d:\tts voice"

echo ====================================================
echo Starting Edge TTS Platform - UMAIR ASHIQ
echo ====================================================
echo.

start "" /b node server/dist/index.js
timeout /t 2 /nobreak >nul

echo Starting Public Tunnel...
start "" "d:\tts voice\cloudflared.exe" tunnel --url http://localhost:5000

echo.
echo Platform is Live!
echo ====================================================
pause

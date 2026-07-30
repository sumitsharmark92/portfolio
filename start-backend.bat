@echo off
title Start Backend + Cloudflare Tunnel
color 0a

echo ============================================================
echo   SUMIT-LABS.ME BACKEND SERVER + CLOUDFLARE TUNNEL
echo ============================================================
echo.
echo   Frontend: https://sumit-labs.me (GitHub Pages)
echo   Backend:  https://api.sumit-labs.me (Your Laptop)
echo.
echo ============================================================
echo.

echo [1/2] Starting Node.js backend server on port 3000...
cd /d "d:\my web"
start "Backend Server" cmd /k "node server.js"

echo [2/2] Starting Cloudflare Tunnel (api.sumit-labs.me)...
timeout /t 3 /nobreak >nul
cloudflared tunnel --url http://localhost:3000 --hostname api.sumit-labs.me

pause

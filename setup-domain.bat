@echo off
title sumit-labs.me Domain Setup Assistant
color 0a

echo ============================================================
echo   SUMIT-LABS.ME DOMAIN TUNNEL SETUP (Cloudflare Tunnel)
echo   Connect your laptop's backend to https://sumit-labs.me
echo ============================================================
echo.

echo Step 1: Checking cloudflared installation...
where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] cloudflared CLI is not installed yet.
    echo.
    echo Installation Options:
    echo Option A (winget): winget install Cloudflare.cloudflared
    echo Option B (Download EXE): https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
    echo.
    echo Or run quick tunnel command without installation:
    echo npx cloudflared tunnel --url http://localhost:3000
    echo.
    pause
    exit /b
)

echo [✓] cloudflared found!
echo.
echo Step 2: To permanently link sumit-labs.me to your laptop:
echo.
echo   1. Run: cloudflared tunnel login
echo   2. Run: cloudflared tunnel create sumit-labs-tunnel
echo   3. Run: cloudflared tunnel route dns sumit-labs-tunnel sumit-labs.me
echo   4. Run: cloudflared tunnel run --url http://localhost:3000 sumit-labs-tunnel
echo.
echo Or run quick tunnel for immediate testing:
echo   cloudflared tunnel --url http://localhost:3000
echo.
pause

@echo off
title sumit-labs.me Full Deployment
color 0a
echo.
echo ============================================================
echo   SUMIT-LABS.ME FULL DEPLOYMENT SCRIPT
echo   This script will:
echo     1. Push all code to GitHub
echo     2. Delete old Cloudflare tunnel
echo     3. Create new tunnel for api.sumit-labs.me
echo     4. Configure DNS routing
echo     5. Create tunnel config
echo     6. Start backend server + tunnel
echo ============================================================
echo.

cd /d "d:\my web"

echo.
echo ============================================================
echo   STEP 1: PUSH CODE TO GITHUB
echo ============================================================
echo.

if not exist ".git" (
    echo Initializing git repository...
    git init
    git branch -M main
)

git remote remove origin 2>nul
git remote add origin https://github.com/sumitsharmark92/portfolio.git

echo Staging all files...
git add .

echo Committing changes...
git commit -m "Fix: route API/WS to api.sumit-labs.me for production"

echo Pushing to GitHub...
git push -u origin main --force

if %errorlevel% neq 0 (
    echo [!] Git push failed. Check credentials and try again.
    pause
    exit /b 1
)

echo [OK] Code pushed to GitHub successfully!
echo.

echo ============================================================
echo   STEP 2: SETUP CLOUDFLARE TUNNEL
echo ============================================================
echo.

echo Checking cloudflared login status...
cloudflared tunnel list >nul 2>&1
if %errorlevel% neq 0 (
    echo You need to login to Cloudflare first...
    cloudflared tunnel login
)

echo Deleting old tunnel if exists...
cloudflared tunnel delete -f sumit-labs 2>nul
cloudflared tunnel delete -f sumit-api 2>nul

echo Creating new tunnel 'sumit-api'...
cloudflared tunnel create sumit-api

echo Routing api.sumit-labs.me to tunnel...
cloudflared tunnel route dns -f sumit-api api.sumit-labs.me

echo.
echo ============================================================
echo   STEP 3: CREATE TUNNEL CONFIG
echo ============================================================
echo.

REM Get tunnel ID
for /f "tokens=1" %%i in ('cloudflared tunnel list -o json 2^>nul ^| findstr /r "\"id\""') do set TUNNEL_ID=%%i

REM Create config directory if needed
if not exist "%USERPROFILE%\.cloudflared" mkdir "%USERPROFILE%\.cloudflared"

REM Write config file
(
echo tunnel: sumit-api
echo.
echo ingress:
echo   - hostname: api.sumit-labs.me
echo     service: http://localhost:3000
echo   - service: http_status:404
) > "%USERPROFILE%\.cloudflared\config.yml"

echo [OK] Tunnel config created at %USERPROFILE%\.cloudflared\config.yml
echo.

echo ============================================================
echo   STEP 4: START BACKEND + TUNNEL
echo ============================================================
echo.
echo Starting Node.js server on port 3000...
start "sumit-labs Backend" cmd /k "cd /d d:\my web && node server.js"

echo Waiting 3 seconds for server to start...
timeout /t 3 /nobreak >nul

echo Starting Cloudflare Tunnel...
echo.
echo ========================================
echo   YOUR SITE IS NOW LIVE!
echo   Frontend: https://sumit-labs.me
echo   Backend:  https://api.sumit-labs.me
echo ========================================
echo.

cloudflared tunnel run sumit-api

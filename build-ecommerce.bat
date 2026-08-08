@echo off
title Build and Export E-Commerce Next.js App
color 0b
echo.
echo ============================================================
echo   BUILDING NEXT.JS E-COMMERCE APP FOR SUMIT-LABS.ME/E-COMMERCE
echo ============================================================
echo.

cd /d "d:\my web\new web project"

echo Installing dependencies if needed...
call npm install --no-audit --no-fund

echo Building Next.js static export...
call npm run build

if %errorlevel% neq 0 (
    echo [!] Build failed! Please check error messages above.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   COPYING EXPORTED FILES TO D:\MY WEB\E-COMMERCE
echo ============================================================
echo.

if not exist "d:\my web\e-commerce" mkdir "d:\my web\e-commerce"

xcopy /E /I /Y "d:\my web\new web project\out\*" "d:\my web\e-commerce\"

echo.
echo [OK] E-Commerce app successfully exported to d:\my web\e-commerce!
echo You can now access https://sumit-labs.me/e-commerce/ once deployed.
echo.
pause

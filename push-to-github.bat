@echo off
title Push sumit.sh Portfolio to GitHub
color 0a

echo ============================================================
echo   PUSHING PORTFOLIO TO GITHUB (sumitsharmark92/portfolio)
echo ============================================================
echo.

cd /d "d:\my web"

if not exist ".git" (
    echo Initializing git repository...
    git init
    git branch -M main
)

echo Setting remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/sumitsharmark92/portfolio.git

echo Staging files...
git add .

echo Committing...
git commit -m "Deploy portfolio to sumit-labs.me"

echo Pushing to GitHub (forcing update to sync with main)...
git push -u origin main --force

echo.
if %errorlevel% equ 0 (
    echo [✓] Successfully pushed to https://github.com/sumitsharmark92/portfolio!
) else (
    echo [!] Push encountered an issue. Make sure git credentials are set.
)

pause

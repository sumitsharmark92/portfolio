@echo off
title Deploy sumit.sh Portfolio & Backend to Vercel (24/7 Online)
color 0a
echo.
echo ============================================================
echo   VERCEL 24/7 DEPLOYMENT SCRIPT FOR SUMIT.SH
echo   This will push code to GitHub and deploy to Vercel.
echo ============================================================
echo.

cd /d "d:\my web"

echo Step 1: Staging and committing all updates...
git add .
git commit -m "Deploy: Full debug, 24/7 Vercel backend, Gemini AI API, and Admin Portal"

echo.
echo Step 2: Pushing to GitHub (triggers automated 24/7 Vercel deployment)...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [!] Push failed. If needed, you can also deploy directly via Vercel CLI.
) else (
    echo.
    echo [OK] Successfully pushed to GitHub repository!
)

echo.
echo Step 3: Checking for Vercel CLI...
where vercel >nul 2>&1
if %errorlevel% equ 0 (
    echo Deploying with Vercel CLI to production...
    vercel --prod
) else (
    echo [NOTE] If you have Vercel connected to your GitHub repo (sumitsharmark92/portfolio),
    echo it will automatically build and deploy your backend to be ONLINE 24/7!
    echo.
    echo To deploy directly via CLI, run: npx vercel --prod
)

echo.
echo ============================================================
echo   PORTFOLIO & BACKEND DEPLOYMENT READY
echo   Admin Portal: https://sumit-labs.me/admin.html
echo   Vercel URL:   https://your-project.vercel.app
echo ============================================================
echo.
pause

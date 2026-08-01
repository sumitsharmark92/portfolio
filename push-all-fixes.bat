@echo off
title Push All Portfolio & App Fixes to GitHub
cd /d "d:\my web"
git add .
git commit -m "Update portfolio apps: universal media sync (YouTube + Web MP4/MP3), chat, and AI widget"
git push origin main --force
echo.
echo ============================================================
echo [SUCCESS] All updates successfully pushed to GitHub!
echo Wait ~60-90 seconds for GitHub Pages deployment.
echo ============================================================
pause

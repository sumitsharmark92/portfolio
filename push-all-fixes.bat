@echo off
title Push All Jam & Media Sync Fixes
cd /d "d:\my web"
git add jam.html jam.js sync.js watch.js push-all-fixes.bat
git commit -m "Support YouTube + Web Media URLs (MP4, MP3, WebM) with auto iframe/HTML5 player fallback for all devices"
git push origin main --force
echo.
echo ============================================================
echo [SUCCESS] Universal Media & Jam Fixes pushed to GitHub!
echo Wait ~60-90 seconds for GitHub Pages deployment.
echo ============================================================
pause

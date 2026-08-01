@echo off
title Push Cross-Browser YouTube & Sync Fixes
cd /d "d:\my web"
git add jam.js sync.js watch.js push-all-fixes.bat
git commit -m "Fix cross-browser YouTube player: youtube-nocookie host, playsinline, play before seekTo, safe origin"
git push origin main --force
echo.
echo ============================================================
echo [SUCCESS] Cross-browser fixes pushed to GitHub!
echo Wait ~60-90 seconds for GitHub Pages deployment.
echo ============================================================
pause

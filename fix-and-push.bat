@echo off
title Push All Jam Fixes to GitHub
color 0a

echo ============================================================
echo   Pushing ALL Jam Fixes (including sync.js)
echo ============================================================

cd /d "d:\my web"

git add jam.js sync.js watch.js fix-and-push.bat
git commit -m "Fix sync.js: skip clock sync in fallback, synchronous room creation, add debug logs"
git push origin main --force

echo.
if %errorlevel% equ 0 (
    echo [SUCCESS] All changes pushed! Wait ~2 min then test https://sumit-labs.me/jam.html
) else (
    echo [INFO] Nothing new to push or already up to date.
)

pause

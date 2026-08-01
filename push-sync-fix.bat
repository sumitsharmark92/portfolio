@echo off
title Push sync.js fix
cd /d "d:\my web"
git add sync.js fix-and-push.bat
git commit -m "Fix sync.js: synchronous fallback room creation, skip clock sync in fallback mode"
git push origin main --force
echo Done!
pause

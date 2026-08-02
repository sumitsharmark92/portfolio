@echo off
echo ============================================================
echo   Moving client files to feature-based folder structure
echo ============================================================

cd /d "D:\my web"

REM === Create directories ===
mkdir "shared\ui" 2>nul
mkdir "jam\ui" 2>nul
mkdir "watch\ui" 2>nul
mkdir "chat\ui" 2>nul
mkdir "games\ui" 2>nul
mkdir "guestbook\ui" 2>nul
mkdir "polls\ui" 2>nul
mkdir "whiteboard\ui" 2>nul
mkdir "ai-chat\ui" 2>nul
mkdir "playground\ui" 2>nul
mkdir "peer-rooms\ui" 2>nul
mkdir "tools\ui" 2>nul

REM === Move shared UI files ===
echo Moving shared files...
copy "style.css" "shared\ui\style.css" >nul
copy "script.js" "shared\ui\script.js" >nul

REM === Move feature UI files ===
echo Moving jam files...
copy "jam.js" "jam\ui\jam.js" >nul
copy "sync.js" "jam\ui\sync.js" >nul

echo Moving watch files...
copy "watch.js" "watch\ui\watch.js" >nul

echo Moving chat files...
copy "chat.js" "chat\ui\chat.js" >nul

echo Moving games files...
copy "games.js" "games\ui\games.js" >nul

echo Moving guestbook files...
copy "guestbook.js" "guestbook\ui\guestbook.js" >nul

echo Moving polls files...
copy "polls.js" "polls\ui\polls.js" >nul

echo Moving whiteboard files...
copy "draw.js" "whiteboard\ui\draw.js" >nul

echo Moving ai-chat files...
copy "ai-chat.js" "ai-chat\ui\ai-chat.js" >nul

echo Moving playground files...
copy "playground.js" "playground\ui\playground.js" >nul

echo Moving peer-rooms files...
copy "peer-rooms.js" "peer-rooms\ui\peer-rooms.js" >nul

echo Moving tools files...
copy "tools\json.html" "tools\ui\json.html" >nul

REM === Delete old root files (after verifying copies worked) ===
echo.
echo Cleaning up old root-level files...
del "style.css"
del "script.js"
del "jam.js"
del "sync.js"
del "watch.js"
del "chat.js"
del "games.js"
del "guestbook.js"
del "polls.js"
del "draw.js"
del "ai-chat.js"
del "playground.js"
del "peer-rooms.js"
del "presence.js"
del "db.js"

REM === Delete old lib folder ===
echo Deleting old lib\ folder...
rmdir /s /q "lib"

REM === Delete batch scripts ===
echo Deleting batch scripts...
del "fix-and-push.bat"
del "push-all-fixes.bat"
del "push-sync-fix.bat"
del "push-to-github.bat"
del "setup-domain.bat"
del "start-backend.bat"

echo.
echo ============================================================
echo   File moves complete!
echo   Now update server.js and HTML files manually.
echo ============================================================
pause

@echo off
echo ============================================================
echo   Executing Portfolio Feature-Based Folder Restructure
echo ============================================================
cd /d "D:\my web"

echo 1. Creating directory structure...
mkdir "shared\ui" 2>nul
mkdir "jam\ui" 2>nul
mkdir "watch\ui" 2>nul
mkdir "chat\ui" 2>nul
mkdir "games\ui" 2>nul
mkdir "guestbook\ui" 2>nul
mkdir "polls\ui" 2>nul
mkdir "whiteboard\ui" 2>nul
mkdir "cursors\ui" 2>nul
mkdir "ai-chat\ui" 2>nul
mkdir "playground\ui" 2>nul
mkdir "peer-rooms\ui" 2>nul
mkdir "tools\ui" 2>nul

echo 2. Copying UI assets to feature folders...
copy /Y "style.css" "shared\ui\style.css"
copy /Y "script.js" "shared\ui\script.js"
copy /Y "jam.js" "jam\ui\jam.js"
copy /Y "sync.js" "jam\ui\sync.js"
copy /Y "watch.js" "watch\ui\watch.js"
copy /Y "chat.js" "chat\ui\chat.js"
copy /Y "games.js" "games\ui\games.js"
copy /Y "guestbook.js" "guestbook\ui\guestbook.js"
copy /Y "polls.js" "polls\ui\polls.js"
copy /Y "draw.js" "whiteboard\ui\draw.js"
copy /Y "presence.js" "cursors\ui\presence.js"
copy /Y "ai-chat.js" "ai-chat\ui\ai-chat.js"
copy /Y "playground.js" "playground\ui\playground.js"
copy /Y "peer-rooms.js" "peer-rooms\ui\peer-rooms.js"
copy /Y "tools\json.html" "tools\ui\json.html"

echo 3. Cleaning up old root-level UI/backend files...
del /F /Q "style.css"
del /F /Q "script.js"
del /F /Q "jam.js"
del /F /Q "sync.js"
del /F /Q "watch.js"
del /F /Q "chat.js"
del /F /Q "games.js"
del /F /Q "guestbook.js"
del /F /Q "polls.js"
del /F /Q "draw.js"
del /F /Q "presence.js"
del /F /Q "ai-chat.js"
del /F /Q "playground.js"
del /F /Q "peer-rooms.js"
del /F /Q "db.js"

echo 4. Removing obsolete directories and batch scripts...
rmdir /S /Q "lib" 2>nul
del /F /Q "fix-and-push.bat" 2>nul
del /F /Q "push-all-fixes.bat" 2>nul
del /F /Q "push-sync-fix.bat" 2>nul
del /F /Q "push-to-github.bat" 2>nul
del /F /Q "setup-domain.bat" 2>nul
del /F /Q "start-backend.bat" 2>nul

echo ============================================================
echo   Restructure files moved and cleaned up successfully!
echo ============================================================

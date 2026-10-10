@echo off
cd /d "%~dp0"
echo Replace www\index.html with the new MediaFlow HTML before continuing.
pause
call npx cap sync android
pause

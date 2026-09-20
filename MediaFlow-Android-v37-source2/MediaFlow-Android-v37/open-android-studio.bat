@echo off
cd /d "%~dp0"
call npm install
call npx cap sync android
call npx cap open android

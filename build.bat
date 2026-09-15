@echo off
REM Build MediaFlow 20.0.0 for Windows
echo Building MediaFlow...
where node >nul 2>nul || (echo Node.js is required: https://nodejs.org & pause & exit /b 1)
call npm install || (pause & exit /b 1)
call npm run build || (pause & exit /b 1)
echo.
echo Build complete. Check the dist folder.
pause

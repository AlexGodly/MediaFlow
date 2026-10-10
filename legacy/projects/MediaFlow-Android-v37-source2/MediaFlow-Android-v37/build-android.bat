@echo off
setlocal
cd /d "%~dp0"
echo [MediaFlow] Installing dependencies...
call npm install
if errorlevel 1 goto :error
echo [MediaFlow] Syncing web app to Android...
call npx cap sync android
if errorlevel 1 goto :error
echo [MediaFlow] Building debug APK...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 goto :error
echo.
echo Build complete.
echo APK: android\app\build\outputs\apk\debug\app-debug.apk
pause
exit /b 0
:error
echo.
echo Build failed. See the error above.
pause
exit /b 1

@echo off
setlocal EnableExtensions EnableDelayedExpansion
title MediaFlow Android - Automatic APK Builder

cd /d "%~dp0"

echo ============================================================
echo        MediaFlow Android - Automatic APK Builder
echo ============================================================
echo.

set "JDK="

echo [1/6] Searching for a REAL Java JDK...
echo.

REM ------------------------------------------------------------
REM Check current JAVA_HOME, but ONLY if it contains java + javac
REM ------------------------------------------------------------

if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" (
        if exist "%JAVA_HOME%\bin\javac.exe" (
            set "JDK=%JAVA_HOME%"
        )
    )
)

REM ------------------------------------------------------------
REM Search Eclipse Adoptium
REM ------------------------------------------------------------

if not defined JDK (
    if exist "C:\Program Files\Eclipse Adoptium" (
        for /d %%J in ("C:\Program Files\Eclipse Adoptium\jdk-*") do (
            if exist "%%~fJ\bin\java.exe" (
                if exist "%%~fJ\bin\javac.exe" (
                    set "JDK=%%~fJ"
                )
            )
        )
    )
)

REM ------------------------------------------------------------
REM Search Oracle / standard Java JDK
REM ------------------------------------------------------------

if not defined JDK (
    if exist "C:\Program Files\Java" (
        for /d %%J in ("C:\Program Files\Java\jdk-*") do (
            if exist "%%~fJ\bin\java.exe" (
                if exist "%%~fJ\bin\javac.exe" (
                    set "JDK=%%~fJ"
                )
            )
        )
    )
)

REM ------------------------------------------------------------
REM Search Microsoft OpenJDK
REM ------------------------------------------------------------

if not defined JDK (
    if exist "C:\Program Files\Microsoft" (
        for /d %%J in ("C:\Program Files\Microsoft\jdk-*") do (
            if exist "%%~fJ\bin\java.exe" (
                if exist "%%~fJ\bin\javac.exe" (
                    set "JDK=%%~fJ"
                )
            )
        )
    )
)

REM ------------------------------------------------------------
REM Search Amazon Corretto
REM ------------------------------------------------------------

if not defined JDK (
    if exist "C:\Program Files\Amazon Corretto" (
        for /d %%J in ("C:\Program Files\Amazon Corretto\jdk*") do (
            if exist "%%~fJ\bin\java.exe" (
                if exist "%%~fJ\bin\javac.exe" (
                    set "JDK=%%~fJ"
                )
            )
        )
    )
)

REM ------------------------------------------------------------
REM Search Azul Zulu
REM ------------------------------------------------------------

if not defined JDK (
    if exist "C:\Program Files\Zulu" (
        for /d %%J in ("C:\Program Files\Zulu\zulu*") do (
            if exist "%%~fJ\bin\java.exe" (
                if exist "%%~fJ\bin\javac.exe" (
                    set "JDK=%%~fJ"
                )
            )
        )
    )
)

REM ------------------------------------------------------------
REM Search Program Files manually for JDK folders
REM ------------------------------------------------------------

if not defined JDK (
    for /d %%A in ("C:\Program Files\*") do (
        for /d %%J in ("%%~fA\jdk*") do (
            if exist "%%~fJ\bin\java.exe" (
                if exist "%%~fJ\bin\javac.exe" (
                    set "JDK=%%~fJ"
                )
            )
        )
    )
)

REM ------------------------------------------------------------
REM No JDK?
REM ------------------------------------------------------------

if not defined JDK (
    echo ============================================================
    echo                    NO JDK FOUND
    echo ============================================================
    echo.
    echo Java may be installed, but a full Java JDK was not found.
    echo.
    echo The Android build requires a JDK containing:
    echo.
    echo     bin\java.exe
    echo     bin\javac.exe
    echo.
    echo The Oracle Common Files folder is NOT a JDK and will
    echo intentionally be ignored by this script.
    echo.
    echo Install JDK 17, then run this file again.
    echo.
    pause
    exit /b 1
)

echo Found JDK:
echo.
echo     %JDK%
echo.

REM ------------------------------------------------------------
REM Set JAVA_HOME
REM ------------------------------------------------------------

echo [2/6] Configuring Java...

set "JAVA_HOME=%JDK%"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo.
echo JAVA_HOME=%JAVA_HOME%
echo.

echo Testing Java...
"%JAVA_HOME%\bin\java.exe" -version

if errorlevel 1 (
    echo.
    echo ERROR: java.exe failed.
    pause
    exit /b 1
)

echo.
echo Testing Java compiler...
"%JAVA_HOME%\bin\javac.exe" -version

if errorlevel 1 (
    echo.
    echo ERROR: javac.exe failed.
    pause
    exit /b 1
)

REM ------------------------------------------------------------
REM Node
REM ------------------------------------------------------------

echo.
echo [3/6] Checking Node.js...

where node.exe >nul 2>&1

if errorlevel 1 (
    echo.
    echo ERROR: Node.js was not found.
    echo.
    pause
    exit /b 1
)

node --version
call npm --version

REM ------------------------------------------------------------
REM npm dependencies
REM ------------------------------------------------------------

echo.
echo [4/6] Installing/checking dependencies...
echo.

call npm install

if errorlevel 1 (
    echo.
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

REM ------------------------------------------------------------
REM Add Android if needed
REM ------------------------------------------------------------

if not exist "%~dp0android\gradlew.bat" (

    echo.
    echo Android project does not exist yet.
    echo Creating it...
    echo.

    call npx cap add android

    if errorlevel 1 (
        echo.
        echo ERROR: Could not create Android project.
        pause
        exit /b 1
    )
)

REM ------------------------------------------------------------
REM Sync
REM ------------------------------------------------------------

echo.
echo [5/6] Syncing MediaFlow...
echo.

call npx cap sync android

if errorlevel 1 (
    echo.
    echo ERROR: Capacitor sync failed.
    pause
    exit /b 1
)

REM ------------------------------------------------------------
REM Build
REM ------------------------------------------------------------

echo.
echo [6/6] Building APK...
echo.
echo The first build can take a while because Gradle may download
echo Android build dependencies.
echo.

cd /d "%~dp0android"

call gradlew.bat assembleDebug

if errorlevel 1 (
    echo.
    echo ============================================================
    echo                    BUILD FAILED
    echo ============================================================
    echo.
    echo The Java problem is fixed if Gradle started successfully.
    echo Look above for the new Gradle/Android error.
    echo.
    pause
    exit /b 1
)

REM ------------------------------------------------------------
REM Copy APK
REM ------------------------------------------------------------

set "APK=%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
set "OUTPUT=%~dp0MediaFlow-v37.apk"

if not exist "%APK%" (
    echo.
    echo ERROR: Gradle reported success but APK was not found.
    echo.
    echo Expected:
    echo %APK%
    echo.
    pause
    exit /b 1
)

copy /Y "%APK%" "%OUTPUT%" >nul

echo.
echo ============================================================
echo.
echo                MEDIАFLOW APK CREATED!
echo.
echo ============================================================
echo.
echo APK:
echo.
echo %OUTPUT%
echo.
echo You can now copy MediaFlow-v37.apk to your Android phone.
echo.

explorer.exe /select,"%OUTPUT%"

pause
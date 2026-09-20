@echo off
setlocal EnableExtensions EnableDelayedExpansion
title MediaFlow Android - Full APK Builder

cd /d "%~dp0"

echo.
echo ============================================================
echo.
echo          MediaFlow v37 - Android APK Builder
echo.
echo ============================================================
echo.

REM ============================================================
REM 1. FIND JAVA JDK
REM ============================================================

echo [1/8] Searching for Java JDK...
echo.

set "JDK="

REM Check current JAVA_HOME
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" (
        if exist "%JAVA_HOME%\bin\javac.exe" (
            set "JDK=%JAVA_HOME%"
        )
    )
)

REM Eclipse Adoptium
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

REM Oracle / Java
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

REM Microsoft OpenJDK
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

REM Amazon Corretto
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

REM Azul Zulu
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

if not defined JDK (
    echo ============================================================
    echo ERROR: JAVA JDK NOT FOUND
    echo ============================================================
    echo.
    echo A complete Java JDK could not be found.
    echo.
    echo MediaFlow requires a JDK containing:
    echo.
    echo     bin\java.exe
    echo     bin\javac.exe
    echo.
    echo Install Eclipse Temurin JDK 21 and run this script again.
    echo.
    pause
    exit /b 1
)

set "JAVA_HOME=%JDK%"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Found:
echo.
echo     %JAVA_HOME%
echo.

"%JAVA_HOME%\bin\java.exe" -version

if errorlevel 1 (
    echo.
    echo ERROR: Java failed to start.
    pause
    exit /b 1
)

echo.
"%JAVA_HOME%\bin\javac.exe" -version

if errorlevel 1 (
    echo.
    echo ERROR: Java compiler failed.
    pause
    exit /b 1
)

REM ============================================================
REM 2. CHECK NODE.JS
REM ============================================================

echo.
echo ============================================================
echo [2/8] Checking Node.js...
echo ============================================================
echo.

where node.exe >nul 2>&1

if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo.
    echo Install Node.js and run this script again.
    echo.
    pause
    exit /b 1
)

where npm.cmd >nul 2>&1

if errorlevel 1 (
    echo ERROR: npm was not found.
    echo.
    pause
    exit /b 1
)

echo Node:
node --version

echo.
echo npm:
call npm --version

REM ============================================================
REM 3. INSTALL NODE DEPENDENCIES
REM ============================================================

echo.
echo ============================================================
echo [3/8] Installing/checking MediaFlow dependencies...
echo ============================================================
echo.

call npm install

if errorlevel 1 (
    echo.
    echo ============================================================
    echo ERROR: npm install failed.
    echo ============================================================
    echo.
    pause
    exit /b 1
)

REM ============================================================
REM 4. ADD ANDROID PLATFORM IF MISSING
REM ============================================================

echo.
echo ============================================================
echo [4/8] Checking Capacitor Android project...
echo ============================================================
echo.

if not exist "%~dp0android\gradlew.bat" (

    echo Android project is missing.
    echo Creating it now...
    echo.

    call npx cap add android

    if errorlevel 1 (
        echo.
        echo ============================================================
        echo ERROR: Capacitor could not create Android.
        echo ============================================================
        echo.
        pause
        exit /b 1
    )

) else (

    echo Android project already exists.

)

REM ============================================================
REM 5. FIND ANDROID SDK
REM ============================================================

echo.
echo ============================================================
echo [5/8] Searching for Android SDK...
echo ============================================================
echo.

set "ANDROIDSDK="

REM Standard Android SDK location
if exist "%LOCALAPPDATA%\Android\Sdk" (
    set "ANDROIDSDK=%LOCALAPPDATA%\Android\Sdk"
)

REM Existing ANDROID_HOME
if not defined ANDROIDSDK (
    if defined ANDROID_HOME (
        if exist "%ANDROID_HOME%" (
            set "ANDROIDSDK=%ANDROID_HOME%"
        )
    )
)

REM Existing ANDROID_SDK_ROOT
if not defined ANDROIDSDK (
    if defined ANDROID_SDK_ROOT (
        if exist "%ANDROID_SDK_ROOT%" (
            set "ANDROIDSDK=%ANDROID_SDK_ROOT%"
        )
    )
)

REM Program Files location
if not defined ANDROIDSDK (
    if exist "C:\Android\Sdk" (
        set "ANDROIDSDK=C:\Android\Sdk"
    )
)

REM User Android folder
if not defined ANDROIDSDK (
    if exist "%USERPROFILE%\Android\Sdk" (
        set "ANDROIDSDK=%USERPROFILE%\Android\Sdk"
    )
)

if not defined ANDROIDSDK (
    echo.
    echo ============================================================
    echo              ANDROID SDK NOT INSTALLED
    echo ============================================================
    echo.
    echo Everything before the Android SDK is working:
    echo.
    echo     Java JDK       OK
    echo     Java compiler  OK
    echo     Node.js        OK
    echo     npm            OK
    echo     Capacitor      OK
    echo     Android project OK
    echo.
    echo But the Android SDK could not be found.
    echo.
    echo Expected location:
    echo.
    echo     %LOCALAPPDATA%\Android\Sdk
    echo.
    echo Android Studio itself is NOT required.
    echo.
    echo You only need Google's Android SDK Command-Line Tools.
    echo.
    echo After installing the Android SDK, run this BAT again.
    echo.
    pause
    exit /b 1
)

echo Android SDK found:
echo.
echo     %ANDROIDSDK%
echo.

set "ANDROID_HOME=%ANDROIDSDK%"
set "ANDROID_SDK_ROOT=%ANDROIDSDK%"

set "PATH=%ANDROIDSDK%\platform-tools;%PATH%"
set "PATH=%ANDROIDSDK%\cmdline-tools\latest\bin;%PATH%"

REM ============================================================
REM CREATE LOCAL.PROPERTIES
REM ============================================================

echo Configuring Gradle SDK location...

set "SDK_ESCAPED=%ANDROIDSDK:\=\\%"

> "%~dp0android\local.properties" echo sdk.dir=%SDK_ESCAPED%

echo.
echo Created:
echo.
echo     android\local.properties
echo.

REM ============================================================
REM CHECK SDK COMPONENTS
REM ============================================================

echo Checking Android SDK components...
echo.

if exist "%ANDROIDSDK%\platform-tools\adb.exe" (
    echo     Platform Tools: OK
) else (
    echo     Platform Tools: not detected
)

if exist "%ANDROIDSDK%\cmdline-tools\latest\bin\sdkmanager.bat" (
    echo     SDK Manager: OK
) else (
    echo     SDK Manager: not detected
)

REM ============================================================
REM ACCEPT LICENSES IF SDKMANAGER EXISTS
REM ============================================================

if exist "%ANDROIDSDK%\cmdline-tools\latest\bin\sdkmanager.bat" (

    echo.
    echo Checking Android SDK licenses...
    echo.

    for /l %%A in (1,1,20) do @echo y
) > "%TEMP%\mediaflow-yes.txt"

if exist "%ANDROIDSDK%\cmdline-tools\latest\bin\sdkmanager.bat" (

    "%ANDROIDSDK%\cmdline-tools\latest\bin\sdkmanager.bat" --licenses < "%TEMP%\mediaflow-yes.txt"

)

if exist "%TEMP%\mediaflow-yes.txt" (
    del "%TEMP%\mediaflow-yes.txt" >nul 2>&1
)

REM ============================================================
REM 6. CAPACITOR SYNC
REM ============================================================

echo.
echo ============================================================
echo [6/8] Syncing MediaFlow with Android...
echo ============================================================
echo.

cd /d "%~dp0"

call npx cap sync android

if errorlevel 1 (
    echo.
    echo ============================================================
    echo ERROR: Capacitor sync failed.
    echo ============================================================
    echo.
    pause
    exit /b 1
)

REM ============================================================
REM 7. BUILD APK
REM ============================================================

echo.
echo ============================================================
echo [7/8] Building MediaFlow APK...
echo ============================================================
echo.
echo The first build may take several minutes.
echo.
echo Gradle may download additional Android components.
echo Do NOT close this window.
echo.

cd /d "%~dp0android"

call gradlew.bat assembleDebug

if errorlevel 1 (
    echo.
    echo ============================================================
    echo.
    echo                    APK BUILD FAILED
    echo.
    echo ============================================================
    echo.
    echo Java:
    echo     %JAVA_HOME%
    echo.
    echo Android SDK:
    echo     %ANDROID_HOME%
    echo.
    echo The setup stages succeeded.
    echo.
    echo Scroll upward and copy the final Gradle error if you
    echo need help with the next problem.
    echo.
    pause
    exit /b 1
)

REM ============================================================
REM 8. COPY FINISHED APK
REM ============================================================

echo.
echo ============================================================
echo [8/8] Locating APK...
echo ============================================================
echo.

set "APK=%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
set "OUTPUT=%~dp0MediaFlow-v37.apk"

if not exist "%APK%" (
    echo ERROR: Gradle finished but app-debug.apk was not found.
    echo.
    echo Expected:
    echo.
    echo     %APK%
    echo.
    pause
    exit /b 1
)

copy /Y "%APK%" "%OUTPUT%" >nul

if errorlevel 1 (
    echo ERROR: Could not copy the APK.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo.
echo             MEDIАFLOW APK BUILD SUCCESSFUL
echo.
echo ============================================================
echo.
echo Your APK has been created:
echo.
echo     %OUTPUT%
echo.
echo ------------------------------------------------------------
echo.
echo You can now:
echo.
echo   1. Connect your Android phone
echo   2. Copy MediaFlow-v37.apk to it
echo   3. Open the APK on the phone
echo   4. Allow installation from this source if Android asks
echo   5. Install MediaFlow
echo.
echo ============================================================
echo.

explorer.exe /select,"%OUTPUT%"

pause

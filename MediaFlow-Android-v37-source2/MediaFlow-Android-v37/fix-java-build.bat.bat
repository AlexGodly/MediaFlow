@echo off
setlocal EnableExtensions EnableDelayedExpansion
title MediaFlow v37 - Complete Android APK Builder
cd /d "%~dp0"

REM ================================================================
REM MediaFlow v37 - COMPLETE Android Builder
REM
REM This script:
REM   1. Finds Java
REM   2. Checks Node/npm
REM   3. Installs npm dependencies
REM   4. Creates Capacitor Android project if needed
REM   5. Downloads Android SDK Command-Line Tools if missing
REM   6. Installs Android SDK packages
REM   7. Accepts Android licenses
REM   8. Configures Gradle
REM   9. Syncs MediaFlow
REM  10. Builds APK
REM  11. Copies APK to this folder
REM ================================================================

echo.
echo ================================================================
echo.
echo          MediaFlow v37 - COMPLETE APK BUILDER
echo.
echo             No Android Studio Required
echo.
echo ================================================================
echo.

REM ================================================================
REM CONFIGURATION
REM ================================================================

set "SDK=%LOCALAPPDATA%\Android\Sdk"

REM Google Android Command Line Tools for Windows
set "TOOLS_URL=https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip"

set "DOWNLOAD=%TEMP%\mediaflow-android-tools.zip"
set "EXTRACT=%TEMP%\mediaflow-android-tools"

REM ================================================================
REM STEP 1 - FIND JAVA
REM ================================================================

echo [1/11] Finding Java JDK...
echo.

set "JDK="

REM Existing JAVA_HOME
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" (
        if exist "%JAVA_HOME%\bin\javac.exe" (
            set "JDK=%JAVA_HOME%"
        )
    )
)

REM Eclipse Adoptium
if not defined JDK (
    for /d %%J in ("C:\Program Files\Eclipse Adoptium\jdk-*") do (
        if exist "%%~fJ\bin\java.exe" (
            if exist "%%~fJ\bin\javac.exe" (
                set "JDK=%%~fJ"
            )
        )
    )
)

REM Oracle
if not defined JDK (
    for /d %%J in ("C:\Program Files\Java\jdk-*") do (
        if exist "%%~fJ\bin\java.exe" (
            if exist "%%~fJ\bin\javac.exe" (
                set "JDK=%%~fJ"
            )
        )
    )
)

REM Microsoft
if not defined JDK (
    for /d %%J in ("C:\Program Files\Microsoft\jdk-*") do (
        if exist "%%~fJ\bin\java.exe" (
            if exist "%%~fJ\bin\javac.exe" (
                set "JDK=%%~fJ"
            )
        )
    )
)

REM Amazon
if not defined JDK (
    for /d %%J in ("C:\Program Files\Amazon Corretto\jdk*") do (
        if exist "%%~fJ\bin\java.exe" (
            if exist "%%~fJ\bin\javac.exe" (
                set "JDK=%%~fJ"
            )
        )
    )
)

if not defined JDK (
    echo ================================================================
    echo ERROR: Java JDK not found.
    echo ================================================================
    echo.
    echo Install Eclipse Temurin JDK 21 first.
    echo.
    pause
    exit /b 1
)

set "JAVA_HOME=%JDK%"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Found:
echo     %JAVA_HOME%
echo.

"%JAVA_HOME%\bin\java.exe" -version

if errorlevel 1 goto JAVA_ERROR

echo.

"%JAVA_HOME%\bin\javac.exe" -version

if errorlevel 1 goto JAVA_ERROR

goto JAVA_OK

:JAVA_ERROR
echo.
echo Java installation failed validation.
pause
exit /b 1

:JAVA_OK

REM ================================================================
REM STEP 2 - NODE
REM ================================================================

echo.
echo ================================================================
echo [2/11] Checking Node.js and npm...
echo ================================================================
echo.

where node.exe >nul 2>&1

if errorlevel 1 (
    echo ERROR: Node.js was not found.
    pause
    exit /b 1
)

where npm.cmd >nul 2>&1

if errorlevel 1 (
    echo ERROR: npm was not found.
    pause
    exit /b 1
)

echo Node:
node --version

echo npm:
call npm --version

REM ================================================================
REM STEP 3 - NPM
REM ================================================================

echo.
echo ================================================================
echo [3/11] Installing MediaFlow dependencies...
echo ================================================================
echo.

call npm install

if errorlevel 1 (
    echo.
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

REM ================================================================
REM STEP 4 - CAPACITOR ANDROID
REM ================================================================

echo.
echo ================================================================
echo [4/11] Checking Android project...
echo ================================================================
echo.

if not exist "%~dp0android\gradlew.bat" (

    echo Android platform not found.
    echo Creating it...
    echo.

    call npx cap add android

    if errorlevel 1 (
        echo.
        echo ERROR: Capacitor could not create Android project.
        pause
        exit /b 1
    )

) else (

    echo Android project already exists.

)

REM ================================================================
REM STEP 5 - CREATE SDK DIRECTORY
REM ================================================================

echo.
echo ================================================================
echo [5/11] Checking Android SDK...
echo ================================================================
echo.

if not exist "%SDK%" (
    echo Creating:
    echo     %SDK%
    echo.
    mkdir "%SDK%" >nul 2>&1
)

REM ================================================================
REM STEP 6 - INSTALL COMMAND LINE TOOLS
REM ================================================================

echo.
echo ================================================================
echo [6/11] Checking Android Command-Line Tools...
echo ================================================================
echo.

set "SDKMANAGER=%SDK%\cmdline-tools\latest\bin\sdkmanager.bat"

if exist "%SDKMANAGER%" (
    echo Android Command-Line Tools already installed.
    goto TOOLS_READY
)

echo Android Command-Line Tools are missing.
echo.
echo Downloading them directly from Google...
echo.
echo This download can take a while.
echo.

if exist "%DOWNLOAD%" del /f /q "%DOWNLOAD%" >nul 2>&1
if exist "%EXTRACT%" rmdir /s /q "%EXTRACT%" >nul 2>&1

REM Try curl first

where curl.exe >nul 2>&1

if not errorlevel 1 (

    curl.exe -L --fail --retry 3 --retry-delay 3 ^
    -o "%DOWNLOAD%" ^
    "%TOOLS_URL%"

) else (

    echo curl not found. Using PowerShell...

    powershell.exe -NoProfile -ExecutionPolicy Bypass ^
    -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '%TOOLS_URL%' -OutFile '%DOWNLOAD%'"

)

if not exist "%DOWNLOAD%" (
    echo.
    echo ================================================================
    echo DOWNLOAD FAILED
    echo ================================================================
    echo.
    echo Android Command-Line Tools could not be downloaded.
    echo.
    echo Check your Internet connection and run this BAT again.
    echo.
    pause
    exit /b 1
)

echo.
echo Download complete.
echo.
echo Extracting Android tools...
echo.

mkdir "%EXTRACT%" >nul 2>&1

powershell.exe -NoProfile -ExecutionPolicy Bypass ^
-Command "Expand-Archive -LiteralPath '%DOWNLOAD%' -DestinationPath '%EXTRACT%' -Force"

if errorlevel 1 (
    echo.
    echo ERROR: Could not extract Android tools.
    pause
    exit /b 1
)

REM Google's ZIP contains:
REM
REM cmdline-tools\
REM     bin\
REM     lib\
REM
REM Capacitor/Android convention:
REM
REM SDK\
REM   cmdline-tools\
REM       latest\
REM           bin\
REM           lib\

if not exist "%SDK%\cmdline-tools" (
    mkdir "%SDK%\cmdline-tools"
)

if exist "%SDK%\cmdline-tools\latest" (
    rmdir /s /q "%SDK%\cmdline-tools\latest"
)

mkdir "%SDK%\cmdline-tools\latest"

xcopy "%EXTRACT%\cmdline-tools\*" ^
      "%SDK%\cmdline-tools\latest\" ^
      /E /I /H /Y >nul

if not exist "%SDKMANAGER%" (
    echo.
    echo ================================================================
    echo ERROR: sdkmanager was not created.
    echo ================================================================
    echo.
    echo Expected:
    echo.
    echo %SDKMANAGER%
    echo.
    pause
    exit /b 1
)

echo Android Command-Line Tools installed successfully.

:TOOLS_READY

REM ================================================================
REM CONFIGURE ANDROID ENVIRONMENT
REM ================================================================

set "ANDROID_HOME=%SDK%"
set "ANDROID_SDK_ROOT=%SDK%"

set "PATH=%SDK%\platform-tools;%PATH%"
set "PATH=%SDK%\cmdline-tools\latest\bin;%PATH%"

echo.
echo Android SDK:
echo.
echo     %ANDROID_HOME%
echo.

REM ================================================================
REM STEP 7 - LICENSES
REM ================================================================

echo.
echo ================================================================
echo [7/11] Accepting Android SDK licenses...
echo ================================================================
echo.

REM Feed lots of "y" responses into sdkmanager

(
for /l %%A in (1,1,100) do echo y
) > "%TEMP%\mediaflow-licenses.txt"

call "%SDKMANAGER%" --sdk_root="%SDK%" --licenses ^
< "%TEMP%\mediaflow-licenses.txt"

del "%TEMP%\mediaflow-licenses.txt" >nul 2>&1

REM ================================================================
REM STEP 8 - INSTALL SDK PACKAGES
REM ================================================================

echo.
echo ================================================================
echo [8/11] Installing Android SDK packages...
echo ================================================================
echo.
echo This can take several minutes on the first run.
echo.
echo Installing:
echo.
echo     Platform Tools
echo     Android Platform
echo     Android Build Tools
echo.

REM Capacitor's Gradle project can request newer components as needed.
REM These provide the base SDK required to begin the build.

call "%SDKMANAGER%" ^
    --sdk_root="%SDK%" ^
    "platform-tools" ^
    "platforms;android-35" ^
    "build-tools;35.0.0"

if errorlevel 1 (
    echo.
    echo ================================================================
    echo ERROR: Android SDK package installation failed.
    echo ================================================================
    echo.
    echo Check the output above.
    echo.
    pause
    exit /b 1
)

REM ================================================================
REM CREATE local.properties
REM ================================================================

echo.
echo Configuring Gradle...

set "SDK_PROPERTIES=%SDK:\=\\%"

> "%~dp0android\local.properties" echo sdk.dir=%SDK_PROPERTIES%

echo.
echo Created:
echo.
echo     android\local.properties
echo.

REM ================================================================
REM OPTIONAL PERMANENT ENVIRONMENT VARIABLES
REM ================================================================

echo Saving Android SDK environment variables...

setx ANDROID_HOME "%SDK%" >nul
setx ANDROID_SDK_ROOT "%SDK%" >nul

REM ================================================================
REM STEP 9 - CAPACITOR SYNC
REM ================================================================

echo.
echo ================================================================
echo [9/11] Syncing MediaFlow v37...
echo ================================================================
echo.

cd /d "%~dp0"

call npx cap sync android

if errorlevel 1 (
    echo.
    echo ================================================================
    echo ERROR: Capacitor sync failed.
    echo ================================================================
    echo.
    pause
    exit /b 1
)

REM ================================================================
REM STEP 10 - BUILD
REM ================================================================

echo.
echo ================================================================
echo [10/11] Building MediaFlow APK...
echo ================================================================
echo.
echo Gradle is now compiling MediaFlow.
echo.
echo The first build can take several minutes.
echo Do not close this window.
echo.

cd /d "%~dp0android"

call gradlew.bat assembleDebug

if errorlevel 1 (
    echo.
    echo ================================================================
    echo.
    echo                    BUILD FAILED
    echo.
    echo ================================================================
    echo.
    echo Java:
    echo     %JAVA_HOME%
    echo.
    echo Android SDK:
    echo     %ANDROID_HOME%
    echo.
    echo The Android SDK has now been installed, so you DO NOT
    echo need to install it again.
    echo.
    echo Copy the LAST error shown above and send it to ChatGPT.
    echo.
    pause
    exit /b 1
)

REM ================================================================
REM STEP 11 - GET APK
REM ================================================================

echo.
echo ================================================================
echo [11/11] Preparing finished APK...
echo ================================================================
echo.

set "APK=%~dp0android\app\build\outputs\apk\debug\app-debug.apk"

set "OUTPUT=%~dp0MediaFlow-v37.apk"

if not exist "%APK%" (
    echo.
    echo ================================================================
    echo ERROR: APK NOT FOUND
    echo ================================================================
    echo.
    echo Gradle completed but the APK could not be found at:
    echo.
    echo %APK%
    echo.
    pause
    exit /b 1
)

copy /Y "%APK%" "%OUTPUT%" >nul

if errorlevel 1 (
    echo.
    echo ERROR: Could not copy APK.
    pause
    exit /b 1
)

REM ================================================================
REM CLEAN TEMP FILES
REM ================================================================

if exist "%DOWNLOAD%" (
    del /f /q "%DOWNLOAD%" >nul 2>&1
)

if exist "%EXTRACT%" (
    rmdir /s /q "%EXTRACT%" >nul 2>&1
)

REM ================================================================
REM SUCCESS
REM ================================================================

echo.
echo ================================================================
echo.
echo.
echo              MEDIАFLOW v37 APK CREATED!
echo.
echo.
echo ================================================================
echo.
echo APK:
echo.
echo     %OUTPUT%
echo.
echo Size:
echo.

for %%F in ("%OUTPUT%") do echo     %%~zF bytes

echo.
echo ================================================================
echo.
echo You can now copy:
echo.
echo     MediaFlow-v37.apk
echo.
echo to your Android phone and install it.
echo.
echo Android may ask you to allow:
echo.
echo     "Install unknown apps"
echo.
echo This is normal for an APK installed outside Google Play.
echo.
echo ================================================================
echo.

explorer.exe /select,"%OUTPUT%"

pause

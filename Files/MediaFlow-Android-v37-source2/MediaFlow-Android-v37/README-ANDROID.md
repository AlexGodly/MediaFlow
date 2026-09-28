# MediaFlow v37 — Android

This project packages the existing MediaFlow v37 web application as a real Android application using Capacitor.

## What stays intact

The Android build uses the same MediaFlow HTML/JavaScript application, including its Supabase cloud account, library, history, scheduler, statistics, imports, settings, XP/leveling, activity log, and undo/redo behavior.

## Requirements on Windows

1. Install Node.js (current LTS).
2. Install Android Studio and the Android SDK.
3. Let Android Studio install its recommended SDK/platform/build tools.

## Fastest way to run it

1. Extract this project.
2. Double-click `open-android-studio.bat`.
3. Wait for Gradle sync in Android Studio.
4. Connect an Android phone with USB debugging enabled, or start an emulator.
5. Press Run in Android Studio.

## Build an APK

Run `build-android.bat`.

The debug APK will be created at:

`android/app/build/outputs/apk/debug/app-debug.apk`

You can install that APK on an Android device for testing.

## Build for Google Play

For Play Store distribution, create a signed Android App Bundle (AAB) from Android Studio:

Build > Generate Signed App Bundle or APK > Android App Bundle

Keep your signing keystore safe. Future updates to the same Play Store application need the same signing identity.

## Updating MediaFlow later

When MediaFlow v38/v39/etc. is released:

1. Replace `www/index.html` with the new MediaFlow HTML.
2. Run `update-web-app.bat` (or `npx cap sync android`).
3. Update the Android version code/version name before publishing a new release.

You do not need to rebuild the Android wrapper from scratch for each MediaFlow version.

## Application ID

`com.alexgodly.mediaflow`

Choose carefully before publishing. Changing the application ID later makes Android/Google Play treat it as a different application.

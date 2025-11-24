@echo off
echo ========================================
echo Deploying Firestore Rules to Firebase
echo ========================================
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Firebase CLI not found!
    echo.
    echo Please install Firebase CLI first:
    echo   npm install -g firebase-tools
    echo.
    echo Then login:
    echo   firebase login
    echo.
    pause
    exit /b 1
)

echo Checking Firebase login status...
firebase projects:list >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo You need to login to Firebase first.
    echo Running: firebase login
    echo.
    firebase login
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo Login failed. Please try again.
        pause
        exit /b 1
    )
)

echo.
echo Current Firebase project: guestify-7fed9
echo.
echo Deploying Firestore rules...
echo.

firebase deploy --only firestore:rules --project guestify-7fed9

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Rules deployed successfully!
    echo ========================================
    echo.
    echo Please wait 10-20 seconds for rules to propagate.
    echo Then try signing up again.
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ Deployment failed!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
)

pause

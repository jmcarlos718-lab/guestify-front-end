@echo off
echo ========================================
echo Deploying Firestore Security Rules
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Checking Firebase CLI installation...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Firebase CLI is not installed!
    echo.
    echo Please install it first:
    echo   npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo Firebase CLI is installed.
echo.

echo Step 2: Checking Firebase authentication...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo Not authenticated. Starting login process...
    echo.
    echo A browser window will open for you to log in to Firebase.
    echo Please complete the authentication in your browser.
    echo.
    firebase login
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Firebase login failed!
        echo Please try again manually: firebase login
        pause
        exit /b 1
    )
) else (
    echo Already authenticated with Firebase.
)

echo.
echo Step 3: Deploying Firestore rules...
echo.
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to deploy Firestore rules!
    echo.
    echo Please check:
    echo   1. You have the correct Firebase project selected
    echo   2. You have permission to deploy rules
    echo   3. The firestore.rules file is valid
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Firestore rules deployed!
echo ========================================
echo.
echo The permission error should now be fixed.
echo Please try signing up again.
echo.
pause




















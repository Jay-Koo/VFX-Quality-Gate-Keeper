@echo off
TITLE VFX Gate - Eye-training
SETLOCAL

:: 1. Make Node.js reachable even if it is not in the system PATH (default install dir)
set "NODE_DIR=C:\Program Files\nodejs"
set "PATH=%NODE_DIR%;%PATH%"

:: 2. Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found.
    echo Install Node.js LTS from https://nodejs.org and run this file again.
    pause
    exit /b 1
)

cls
echo ==========================================
echo    VFX Gate - Eye-training
echo ==========================================

:: 3. First run after clone: node_modules is not in git, so install it
if not exist node_modules (
    echo [SETUP] First run - installing dependencies...
    echo         This needs internet and can take a few minutes.
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Check your internet connection and retry.
        pause
        exit /b 1
    )
)

echo Starting local server - your browser opens when it is ready.
echo * Keep this window open while using the program.
echo * Close this window to stop the program.
echo ==========================================

:: 4. Run the dev server; --open launches the browser at the actual port
call npm run dev -- --open

ENDLOCAL
pause

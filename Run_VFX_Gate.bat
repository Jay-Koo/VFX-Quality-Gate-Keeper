@echo off
TITLE VFX Quality Gate Keeper v3.0 - Runner
SETLOCAL

:: 1. Define Local Node.js Path (Ensuring it works even if not in System PATH)
set "NODE_DIR=C:\Program Files\nodejs"
set "PATH=%NODE_DIR%;%PATH%"

:: 2. Check if Node.js is accessible
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found at %NODE_DIR%
    echo Please ensure Node.js is installed correctly.
    pause
    exit /b
)

:: 3. Clear Screen and Show Branding
cls
echo ==========================================
echo    VFX Quality Gate Keeper v3.0
echo ==========================================
echo [1/2] Starting local server...
echo [2/2] Opening your browser at http://localhost:5173
echo.
echo * Keep this window open while using the program.
echo * Close this window to stop the program.
echo ==========================================

:: 4. Open the default browser to the localhost address
start http://localhost:5173

:: 5. Run the dev server
npm run dev

ENDLOCAL
pause

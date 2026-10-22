@echo off
title Watchtowr App Launcher
echo ========================================================
echo             STARTING WATCHTOWR PLATFORM
echo ========================================================
echo.

cd /d "%~dp0"
set "PATH=C:\Users\kenwa\AppData\Local\Programs\nodejs;%PATH%"

echo Checking dependencies and starting server...
echo.
echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

call npx next start -p 3000
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Production build not found or failed, falling back to development mode...
    call npm run dev
)

pause

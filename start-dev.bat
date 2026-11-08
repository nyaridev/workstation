@echo off
rem Runs Workstation in its own window with hot reload (needs Node 22+, pnpm and Rust).
cd /d "%~dp0"

if not exist node_modules (
    call pnpm install
    if errorlevel 1 goto :fail
)
call pnpm tauri dev
if errorlevel 1 goto :fail
exit /b 0

:fail
echo.
echo Workstation dev failed. See the messages above.
pause
exit /b 1

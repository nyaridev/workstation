@echo off
rem Builds the portable app into release\Workstation.exe.
setlocal
cd /d "%~dp0"

call pnpm install --frozen-lockfile || goto :fail
call pnpm tauri build --no-bundle || goto :fail

if not exist release mkdir release
copy /y src-tauri\target\release\workstation.exe release\Workstation.exe >nul || goto :fail
echo.
echo Built release\Workstation.exe
exit /b 0

:fail
echo Build failed.
exit /b 1

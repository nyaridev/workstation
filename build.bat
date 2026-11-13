@echo off
rem Builds the Windows installer into release\ for a local try (ADR-0016). Only the release workflow signs updates;
rem macOS and Linux are built on GitHub: push a v* tag (.github/workflows/release.yml).
setlocal
cd /d "%~dp0"

call pnpm install --frozen-lockfile || goto :fail
for /f %%v in ('node -p "require('./package.json').version"') do set VERSION=%%v

call pnpm tauri build --config src-tauri\tauri.release.conf.json --bundles nsis || goto :fail

if not exist release mkdir release
copy /y src-tauri\target\release\bundle\nsis\Workstation_%VERSION%_*-setup.exe release\ >nul || goto :fail

echo.
echo Built in release\:
dir /b release
exit /b 0

:fail
echo Build failed.
pause
exit /b 1

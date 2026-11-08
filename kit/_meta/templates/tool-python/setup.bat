@echo off
title {{Title}} - Setup
cd /d "%~dp0"

where uv >nul 2>&1
if errorlevel 1 (
    echo [ERROR] uv was not found. Install it with:  winget install astral-sh.uv
    echo         or see https://docs.astral.sh/uv/getting-started/installation/
    pause
    exit /b 1
)

echo Installing dependencies with uv...
uv sync
if errorlevel 1 (
    echo [ERROR] uv sync failed.
    pause
    exit /b 1
)
exit /b 0

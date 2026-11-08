@echo off
title {{Title}}
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo  First run: setting up the environment...
    call setup.bat
    if errorlevel 1 (
        echo  Setup failed. Cannot continue.
        pause
        exit /b 1
    )
)

".venv\Scripts\python.exe" main.py %*
if errorlevel 1 pause

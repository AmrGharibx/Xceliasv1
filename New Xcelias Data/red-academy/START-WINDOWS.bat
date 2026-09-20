@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 22.16 or newer, then run this file again.
  pause
  exit /b 1
)
echo INTERNAL TRAINING SYSTEM - COMPANY WORKSPACE
echo Keep this window open while using the internal system.
echo On first launch, use the setup code below to create your administrator.
echo.
node server.mjs
pause

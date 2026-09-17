@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 22.16 or newer, then run this file again.
  pause
  exit /b 1
)
echo RED ACADEMY - PRIVATE WORKSPACE
echo Keep this window open while using the academy.
echo On first launch, use the setup code below to create your administrator.
echo.
node server.mjs
pause

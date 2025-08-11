@echo off
title Ritual Site Server
echo.
echo ====================================
echo    🎨 RITUAL SITE SERVER 🎨
echo ====================================
echo.
echo Starting server...
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

:: Start the server
echo 🚀 Starting server...
echo.
node server.js

echo.
echo Server stopped. Press any key to exit...
pause >nul
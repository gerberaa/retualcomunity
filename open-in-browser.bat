@echo off
title Open Ritual Site
echo.
echo 🌐 Opening Ritual Site...
echo.

:: Check if server is running
timeout /t 2 /nobreak >nul

:: Try to open the local version first
start http://localhost:3000

echo ✅ Site opened in browser!
echo.
echo 📱 To access from other devices:
echo Check the server console for the network IP address
echo.
pause
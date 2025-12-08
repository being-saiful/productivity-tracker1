@echo off
REM Productivity Tracker - Quick Start Script

echo.
echo ================================
echo PRODUCTIVITY TRACKER - START
echo ================================
echo.

REM Check if Node is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Start the backend server
echo Starting Backend Server...
echo Port: 3000
echo Database: data/pt.sqlite3
echo.
echo After the backend starts, you can:
echo 1. Open http://localhost:3000 in your browser
echo 2. Create an account to get started
echo.
echo To also run the ML service, open another terminal and run:
echo   .venv\Scripts\python public\main.py
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

@echo off
echo Starting PDF Nexus Full Stack Application...
echo.
echo Starting Backend Server on port 3001...
start cmd /k "cd server && npm start"
timeout /t 3
echo.
echo Starting Frontend on port 5173...
start cmd /k "npm run dev"
echo.
echo Both servers starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
pause

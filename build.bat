@echo off
REM Production Build Script for PDF Nexus

echo ========================================
echo Building PDF Nexus for Production
echo ========================================
echo.

REM Build Frontend
echo Building Frontend...
call npm run build

if errorlevel 1 (
    echo.
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo Frontend build complete!
echo.

REM Create deployment structure
echo Creating deployment package...
if not exist "dist\server" mkdir "dist\server"
xcopy /E /I /Y "server\*" "dist\server\" >nul
copy "server\package.json" "dist\server\" >nul
if exist "server\.env" copy "server\.env" "dist\server\" >nul

echo.
echo ========================================
echo Production build complete!
echo ========================================
echo.
echo Deployment package is in: dist\
echo.
echo Next steps:
echo 1. Deploy dist\ folder to your hosting
echo 2. Set environment variables
echo 3. Run: cd dist\server ^&^& npm install --production
echo 4. Start: node server.js
echo.
pause

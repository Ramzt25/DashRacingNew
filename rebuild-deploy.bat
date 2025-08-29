@echo off
REM DASH Racing - Quick Rebuild and Deploy
REM This batch file provides easy access to the PowerShell rebuild script

echo ====================================================================
echo DASH Racing - Comprehensive Rebuild and Deploy Script
echo ====================================================================
echo.
echo Available options:
echo   1. Full rebuild and deploy (default)
echo   2. Full rebuild and deploy (skip tests)
echo   3. Production build and deploy
echo   4. Development build only (no install)
echo   5. Quick validation only
echo   q. Quit
echo.

set /p choice="Enter your choice (1-5, q): "

if "%choice%"=="1" (
    powershell.exe -ExecutionPolicy Bypass -File "%~dp0rebuild-deploy.ps1" -Verbose
) else if "%choice%"=="2" (
    powershell.exe -ExecutionPolicy Bypass -File "%~dp0rebuild-deploy.ps1" -SkipTests -Verbose
) else if "%choice%"=="3" (
    powershell.exe -ExecutionPolicy Bypass -File "%~dp0rebuild-deploy.ps1" -ProductionBuild -Verbose
) else if "%choice%"=="4" (
    powershell.exe -ExecutionPolicy Bypass -File "%~dp0rebuild-deploy.ps1" -SkipTests
) else if "%choice%"=="5" (
    cd mobile\tests\build-validation
    npm run validate
    pause
) else if "%choice%"=="q" (
    exit /b 0
) else (
    echo Invalid choice. Running default full rebuild...
    powershell.exe -ExecutionPolicy Bypass -File "%~dp0rebuild-deploy.ps1" -Verbose
)

pause
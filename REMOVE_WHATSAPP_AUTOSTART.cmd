@echo off
setlocal
cd /d "%~dp0"
echo.
echo DUTRA OS - Remover WhatsApp AutoStart
echo =====================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\uninstall-whatsapp-bridge-autostart.ps1"
set EXITCODE=%ERRORLEVEL%
echo.
pause
exit /b %EXITCODE%

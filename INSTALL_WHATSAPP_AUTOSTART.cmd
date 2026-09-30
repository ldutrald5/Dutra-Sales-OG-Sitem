@echo off
setlocal
cd /d "%~dp0"
echo.
echo DUTRA OS - Instalador do WhatsApp AutoStart
echo ===========================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-whatsapp-bridge-autostart.ps1"
set EXITCODE=%ERRORLEVEL%
echo.
if not "%EXITCODE%"=="0" (
  echo Falha na instalacao. Veja a mensagem acima.
  pause
  exit /b %EXITCODE%
)
echo Instalacao concluida.
echo O Bridge sera iniciado automaticamente nos proximos logins do Windows.
echo.
pause

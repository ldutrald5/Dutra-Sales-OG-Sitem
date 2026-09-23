@echo off
title Sistema OG - PC e Celular
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ". .\Ativar-Ambiente.ps1; Start-Process 'http://127.0.0.1:4321'; npm.cmd run og:start"
pause

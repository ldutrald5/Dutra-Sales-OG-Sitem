@echo off
title Sistema OG - PC e Celular
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ". .\Ativar-Ambiente.ps1; Start-Process 'http://127.0.0.1:4321'; node.exe .\scripts\start-og-desktop.mjs"
pause

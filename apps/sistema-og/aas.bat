@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0.agents\scripts\aas.ps1" %*

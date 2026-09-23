$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$launcher = Join-Path $projectRoot 'INICIAR-SISTEMA-OG.cmd'
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'Sistema OG.lnk'

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcher
$shortcut.WorkingDirectory = $projectRoot
$shortcut.Description = 'Abrir o Sistema OG'
$shortcut.Save()

Write-Host "Atalho criado em: $shortcutPath"

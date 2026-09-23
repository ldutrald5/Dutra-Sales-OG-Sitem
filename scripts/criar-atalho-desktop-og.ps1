# Cria atalho na Area de Trabalho: "Sistema OG" → inicia app com um clique
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Cmd = Join-Path $Root 'INICIAR-SISTEMA-OG.cmd'
if (-not (Test-Path -LiteralPath $Cmd)) {
  throw "Nao achei INICIAR-SISTEMA-OG.cmd em $Root"
}

$Desktop = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop 'Sistema OG.lnk'

$Wsh = New-Object -ComObject WScript.Shell
$Sc = $Wsh.CreateShortcut($ShortcutPath)
$Sc.TargetPath = $Cmd
$Sc.WorkingDirectory = $Root
$Sc.WindowStyle = 7
$Sc.Description = 'Sistema OG — Copiloto Comercial (Olho de Gato)'
$IconCandidate = Join-Path $Root 'apps\sistema-og\assets\icons\icon-512.png'
if (Test-Path -LiteralPath $IconCandidate) {
  # .lnk prefere .ico; usa o cmd como icone generico se nao houver .ico
  $Sc.IconLocation = 'shell32.dll,13'
}
$Sc.Save()

Write-Host ""
Write-Host " Atalho criado:" -ForegroundColor Green
Write-Host " $ShortcutPath" -ForegroundColor Yellow
Write-Host ""
Write-Host " Clique duas vezes em 'Sistema OG' na Area de Trabalho." -ForegroundColor Cyan
Write-Host ""

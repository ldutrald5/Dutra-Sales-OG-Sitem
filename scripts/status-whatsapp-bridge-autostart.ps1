param(
  [string]$TaskName = 'DUTRA-OS-WhatsApp-Bridge'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot 'apps\sistema-og\.data\logs'

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $task) {
  Write-Host "AutoStart: NÃO INSTALADO"
  exit 2
}

$info = Get-ScheduledTaskInfo -TaskName $TaskName
Write-Host "AutoStart: INSTALADO"
Write-Host "Task: $TaskName"
Write-Host "State: $($task.State)"
Write-Host "LastRunTime: $($info.LastRunTime)"
Write-Host "LastTaskResult: $($info.LastTaskResult)"
Write-Host "NextRunTime: $($info.NextRunTime)"

if (Test-Path $logDir) {
  $latest = Get-ChildItem -Path $logDir -Filter 'whatsapp-bridge-*.log' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($latest) {
    Write-Host ""
    Write-Host "Último log: $($latest.FullName)"
    Write-Host "Atualizado: $($latest.LastWriteTime)"
    Write-Host "---- últimas linhas ----"
    Get-Content -LiteralPath $latest.FullName -Tail 15
  }
}

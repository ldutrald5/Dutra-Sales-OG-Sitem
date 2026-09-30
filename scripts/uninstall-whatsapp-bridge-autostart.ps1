param(
  [string]$TaskName = 'DUTRA-OS-WhatsApp-Bridge'
)

$ErrorActionPreference = 'Stop'

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $task) {
  Write-Host "AutoStart já não está instalado."
  exit 0
}

try {
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
} catch {}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "AutoStart removido: $TaskName"
Write-Host "Logs e .env foram preservados."

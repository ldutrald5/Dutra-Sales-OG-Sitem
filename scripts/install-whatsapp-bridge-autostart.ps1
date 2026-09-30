param(
  [string]$TaskName = 'DUTRA-OS-WhatsApp-Bridge'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$launcher = Join-Path $PSScriptRoot 'run-whatsapp-bridge.ps1'

if (-not (Test-Path $launcher)) {
  throw "Launcher não encontrado: $launcher"
}

$envPath = Join-Path $repoRoot '.env'
if (-not (Test-Path $envPath)) {
  throw "Arquivo .env não encontrado. Configure o Bridge antes da instalação do AutoStart."
}

$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$powerShellExe = (Get-Command powershell.exe -ErrorAction Stop).Source
$arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $launcher

$action = New-ScheduledTaskAction -Execute $powerShellExe -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $identity
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'DUTRA OS — Bridge local Kaption/WhatsApp para sincronização com CRM.' -Force | Out-Null

Write-Host ""
Write-Host "AutoStart instalado: $TaskName"
Write-Host "Usuário: $identity"
Write-Host "Repositório: $repoRoot"
Write-Host "Reinício automático: 1 minuto após falha"
Write-Host ""

try {
  Start-ScheduledTask -TaskName $TaskName
  Start-Sleep -Seconds 2
  $task = Get-ScheduledTask -TaskName $TaskName
  $info = Get-ScheduledTaskInfo -TaskName $TaskName
  Write-Host "Estado atual: $($task.State)"
  Write-Host "Último resultado: $($info.LastTaskResult)"
} catch {
  Write-Warning "A tarefa foi instalada, mas não foi possível iniciar imediatamente: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Use: npm run og:whatsapp:autostart:status"

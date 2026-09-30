param(
  [switch]$Once
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$dataDir = Join-Path $repoRoot 'apps\sistema-og\.data'
$logDir = Join-Path $dataDir 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$envPath = Join-Path $repoRoot '.env'
if (-not (Test-Path $envPath)) {
  throw "Arquivo .env não encontrado em $envPath. Configure o Bridge antes de ativar o AutoStart."
}

$envText = Get-Content -Raw -LiteralPath $envPath
$hasBridgeKey = $envText -match '(?m)^\s*OG_WHATSAPP_INGEST_API_KEY\s*=\s*\S+'
$hasLegacyKey = $envText -match '(?m)^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+'
if (-not ($hasBridgeKey -or $hasLegacyKey)) {
  throw 'O .env não possui OG_WHATSAPP_INGEST_API_KEY nem SUPABASE_SERVICE_ROLE_KEY preenchida.'
}

$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) {
  $npm = Get-Command npm -ErrorAction SilentlyContinue
}
if (-not $npm) {
  throw 'npm não foi encontrado no PATH do Windows.'
}

$kaption = Get-Process -ErrorAction SilentlyContinue | Where-Object {
  $_.ProcessName -match 'kaption'
}
if (-not $kaption) {
  Write-Warning 'Kaption não parece estar aberto. O Bridge pode aguardar ou falhar até o Kaption iniciar.'
}

$timestamp = Get-Date -Format 'yyyy-MM-dd'
$logFile = Join-Path $logDir "whatsapp-bridge-$timestamp.log"

"[AUTOSTART] $(Get-Date -Format o) iniciando Bridge em $repoRoot" | Out-File -FilePath $logFile -Append -Encoding utf8

$command = if ($Once) { 'og:whatsapp:bridge:once' } else { 'og:whatsapp:bridge' }

& $npm.Source run $command *>> $logFile
$exitCode = $LASTEXITCODE

"[AUTOSTART] $(Get-Date -Format o) Bridge encerrou com code=$exitCode" | Out-File -FilePath $logFile -Append -Encoding utf8

if ($exitCode -ne 0) {
  exit $exitCode
}

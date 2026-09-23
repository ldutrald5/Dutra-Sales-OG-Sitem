# Sistema OG — inicia o servidor local e abre em modo aplicativo (sem barra de endereço)
# Uso: clique em INICIAR-SISTEMA-OG.cmd ou neste script.
# Não é necessário digitar IP no computador. O celular (opcional) usa o IP mostrado no terminal.

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root 'package.json'))) {
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
  if (Test-Path (Join-Path (Split-Path $Root) 'package.json')) {
    $Root = Split-Path $Root
  }
}

Set-Location -LiteralPath $Root
$Port = if ($env:OG_PORT) { [int]$env:OG_PORT } else { 4321 }
$Url = "http://127.0.0.1:$Port"

function Test-OgPortOpen {
  try {
    $c = New-Object System.Net.Sockets.TcpClient
    $c.Connect('127.0.0.1', $Port)
    $c.Close()
    return $true
  } catch {
    return $false
  }
}

function Find-BrowserApp {
  $candidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:LocalAppData\Microsoft\Edge\Application\msedge.exe"
  )
  foreach ($p in $candidates) {
    if ($p -and (Test-Path -LiteralPath $p)) { return $p }
  }
  return $null
}

function Start-OgWindow {
  param([string]$TargetUrl)
  $browser = Find-BrowserApp
  if ($browser) {
    # Janela tipo aplicativo: sem abas, sem barra de URL
    Start-Process -FilePath $browser -ArgumentList @(
      "--app=$TargetUrl",
      '--new-window',
      "--user-data-dir=$env:LOCALAPPDATA\SistemaOG-AppProfile"
    )
    return
  }
  # Fallback: navegador padrão
  Start-Process $TargetUrl
}

Write-Host ''
Write-Host '  Sistema OG — modo aplicativo' -ForegroundColor Yellow
Write-Host '  =============================' -ForegroundColor DarkYellow
Write-Host "  Pasta: $Root"
Write-Host "  Endereço local (só no PC): $Url"
Write-Host ''

# Ativa ambiente se o script existir (não bloqueia se falhar)
$ativar = Join-Path $Root 'Ativar-Ambiente.ps1'
if (Test-Path -LiteralPath $ativar) {
  try {
    . $ativar
  } catch {
    Write-Host '  Aviso: Ativar-Ambiente.ps1 nao carregou; seguindo com npm do PATH.' -ForegroundColor DarkYellow
  }
}

$alreadyRunning = Test-OgPortOpen
if (-not $alreadyRunning) {
  Write-Host '  Iniciando servidor local...' -ForegroundColor Cyan
  $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (-not $npm) { $npm = Get-Command npm -ErrorAction SilentlyContinue }
  if (-not $npm) {
    Write-Host '  ERRO: npm nao encontrado. Instale Node.js e tente de novo.' -ForegroundColor Red
    Read-Host '  Pressione Enter para fechar'
    exit 1
  }

  $server = Start-Process -FilePath $npm.Source -ArgumentList @('run', 'og:start') `
    -WorkingDirectory $Root -PassThru -WindowStyle Minimized

  $deadline = (Get-Date).AddSeconds(45)
  while (-not (Test-OgPortOpen)) {
    if ((Get-Date) -gt $deadline) {
      Write-Host '  ERRO: servidor nao respondeu a tempo na porta' $Port -ForegroundColor Red
      Read-Host '  Pressione Enter para fechar'
      exit 1
    }
    if ($server.HasExited) {
      Write-Host '  ERRO: o processo do servidor encerrou cedo. Rode: npm run og:start' -ForegroundColor Red
      Read-Host '  Pressione Enter para fechar'
      exit 1
    }
    Start-Sleep -Milliseconds 400
  }
  Write-Host '  Servidor pronto.' -ForegroundColor Green
} else {
  Write-Host '  Servidor ja estava em execucao.' -ForegroundColor Green
}

Write-Host '  Abrindo janela do aplicativo...' -ForegroundColor Cyan
Start-OgWindow -TargetUrl $Url
Write-Host ''
Write-Host '  Pronto. Use o Sistema OG na janela que abriu.' -ForegroundColor Green
Write-Host '  - No PC voce NAO precisa digitar IP.' -ForegroundColor Gray
Write-Host '  - Celular (opcional): mesma Wi-Fi, use o IP que aparecer no terminal do servidor.' -ForegroundColor Gray
Write-Host '  - Feche a janela minimizada do servidor quando terminar o dia.' -ForegroundColor Gray
Write-Host ''

$runtimeScript = Join-Path $PSScriptRoot '..\work\aiox-setup\Ativar-Ambiente.ps1'
if (Test-Path -LiteralPath $runtimeScript) {
  . $runtimeScript
}
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js não encontrado. Instale o Node.js 24 LTS e abra novamente o Sistema OG.'
}

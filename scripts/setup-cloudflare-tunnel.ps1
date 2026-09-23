# Assistente: verifica cloudflared e orienta tunnel rapido ou nomeado
$ErrorActionPreference = 'Continue'
Write-Host ''
Write-Host ' Sistema OG — setup Cloudflare Tunnel' -ForegroundColor Yellow
Write-Host ' ======================================' -ForegroundColor DarkYellow
Write-Host ''

$cf = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cf) {
  Write-Host ' cloudflared NAO esta no PATH.' -ForegroundColor Red
  Write-Host ' 1. Baixe Windows: https://github.com/cloudflare/cloudflared/releases'
  Write-Host '    (ou pagina oficial Cloudflare Tunnel downloads)'
  Write-Host ' 2. Instale / extraia e adicione ao PATH'
  Write-Host ' 3. Feche e abra o terminal; rode este script de novo'
  Write-Host ''
  exit 1
}

Write-Host " cloudflared: $($cf.Source)" -ForegroundColor Green
& cloudflared --version
Write-Host ''

$cfg = Join-Path $env:USERPROFILE '.cloudflared\config.yml'
if (Test-Path $cfg) {
  Write-Host " Config encontrado: $cfg" -ForegroundColor Green
  Write-Host ' Para subir o tunnel fixo:'
  Write-Host '   cloudflared tunnel run' -ForegroundColor Cyan
} else {
  Write-Host ' Sem config nomeado ainda.' -ForegroundColor DarkYellow
  Write-Host ''
  Write-Host ' TESTE RAPIDO (sem dominio):' -ForegroundColor Cyan
  Write-Host '   1. Suba o OG: npm run og:start  (ou INICIAR-SISTEMA-OG.cmd)'
  Write-Host '   2. Rode: cloudflared tunnel --url http://127.0.0.1:4321'
  Write-Host '   3. Copie o https://....trycloudflare.com no celular'
  Write-Host ''
  Write-Host ' TUNNEL FIXO (precisa dominio na Cloudflare):' -ForegroundColor Cyan
  Write-Host '   cloudflared login'
  Write-Host '   cloudflared tunnel create sistema-og'
  Write-Host '   cloudflared tunnel route dns sistema-og og.seudominio.com'
  Write-Host '   (edite config.yml — veja cloudflare/tunnel/config.example.yml)'
  Write-Host '   cloudflared tunnel run sistema-og'
}

Write-Host ''
Write-Host ' Lembrete: PC ligado + OG na porta 4321. Tunnel so publica; nao substitui o servidor.' -ForegroundColor Gray
Write-Host ''

# Cloudflare Tunnel — Sistema OG

Expõe o app que roda no **PC da empresa** (`http://127.0.0.1:4321`) para a internet, sem abrir porta no roteador.

## O que o Tunnel faz e o que não faz

| Faz | Não faz |
|-----|---------|
| Celular na rua / 4G acessa o OG | Substituir o PC ligado |
| Link HTTPS estável (tunnel nomeado) | Guardar dados na nuvem sozinho |
| Casa e empresa no mesmo link | Funcionar com o PC desligado |

Para dados na nuvem **sem** depender do PC, o caminho é o **Worker + KV** (`wrangler deploy`). O Tunnel é o meio-termo rápido.

---

## Opção A — Teste rápido (sem domínio)

1. Instale o [cloudflared para Windows](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. Suba o Sistema OG no PC (`INICIAR-SISTEMA-OG.cmd`).
3. Rode:

```powershell
cloudflared tunnel --url http://127.0.0.1:4321
```

4. O terminal mostra um link `https://….trycloudflare.com`.
5. Abra esse link no celular (qualquer rede) e use **Adicionar à tela inicial**.

URL muda a cada execução. Bom para testar.

---

## Opção B — Tunnel fixo (recomendado no dia a dia)

Requisitos: conta Cloudflare + domínio no Cloudflare (ou subdomínio).

```powershell
cloudflared login
cloudflared tunnel create sistema-og
cloudflared tunnel route dns sistema-og og.seudominio.com
```

Edite `%USERPROFILE%\.cloudflared\config.yml` a partir de `config.example.yml`.

```powershell
cloudflared tunnel run sistema-og
```

No celular: `https://og.seudominio.com` → instalar na tela inicial.

---

## Rotina na empresa

1. `INICIAR-SISTEMA-OG.cmd` (app local)
2. `INICIAR-CLOUDFLARE-TUNNEL.cmd` (túnel)
3. Celular usa o link HTTPS do túnel

Desligou o PC = link para de responder.

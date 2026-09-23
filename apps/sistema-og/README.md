# Sistema OG — Versão Top + Copiloto Comercial

Aplicação local integrada ao projeto AIOX. A base original da Versão Top foi preservada e recebeu uma central comercial com três funções:

- Secretário: fila do dia, follow-ups, prioridades e próximos passos.
- Assistente: contexto por cliente, acesso à cotação e mensagens revisáveis.
- Treinador: lacunas de diagnóstico e perguntas sugeridas a partir dos dados registrados.

## Executar

Na raiz de `meu-projeto-aiox`:

```powershell
. .\Ativar-Ambiente.ps1
npm.cmd run og:start
```

No Windows, também é possível dar dois cliques em `INICIAR-SISTEMA-OG.cmd`. A janela que abrir é o servidor e deve permanecer aberta durante o uso.

Ao iniciar, o terminal mostra dois endereços:

- `http://127.0.0.1:4321` para o computador.
- `http://IP-DO-COMPUTADOR:4321` para o celular conectado à mesma rede Wi-Fi.

O computador precisa permanecer ligado e com o terminal aberto. O servidor guarda uma cópia compartilhada de clientes e cotações em `.data/shared-state.json`, permitindo usar o mesmo conteúdo no PC e no celular.

## Celular e instalação

A aplicação é única e responsiva: no computador mostra a navegação completa; no celular mostra uma barra inferior com Meu Dia, Clientes, Cotação, Vendas e Histórico. Isso evita manter duas bases separadas.

Em hospedagem HTTPS ou no próprio computador, navegadores compatíveis exibem **Instalar app**. O acesso pela rede Wi-Fi funciona normalmente pelo navegador; a instalação como PWA pode exigir HTTPS, dependendo do aparelho.

## Publicação HTTPS

A versão de produção usa Cloudflare Workers, Assets e KV. A interface recebe HTTPS automático, enquanto `/api/state` exige um código de acesso guardado como segredo do Worker. A configuração está em `wrangler.jsonc` e o backend em `cloudflare/worker.mjs`.

## Dados

Os dados continuam armazenados no navegador (`localStorage`) e também são sincronizados com o servidor local enquanto ele estiver ativo. A migração adiciona campos comerciais sem apagar leads antigos. Não há leitura automática de WhatsApp nem envio para APIs de IA.

## Uso recomendado

1. Cadastre ou importe leads no CRM.
2. Abra o cliente e registre dor, decisor, próxima ação e data.
3. Após uma conversa, registre uma nota curta.
4. Use Meu Dia para ordenar a rotina.
5. Gere a cotação pelo mesmo cliente. Salvar uma cotação registra o evento, mas não presume que ela foi enviada.

## Identidade visual premium

A interface usa preto, amarelo Olho de Gato, branco e luz laranja. O hero possui composições próprias para desktop e celular; a área de produto usa uma imagem dedicada do equalizador; o consultor oferece seleção visual entre veículos leves/médios e pesados/conjuntos.

Os PNGs de origem ficam em `assets/premium/`. As versões WebP entregues pelo aplicativo ficam em `assets/premium/optimized/` e podem ser recriadas com:

```powershell
node scripts/optimize-og-assets.mjs
```

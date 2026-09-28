# PROP-01B — Public Proposal Tracking seguro

Status: **em andamento**

## Objetivo

Transformar o rascunho seguro criado no PROP-01A em um link público rastreável, revogável e útil para o vendedor sem expor o CRM, sem persistir o token bruto e sem inventar engajamento.

## Escopo

### Publicação

- vendedor salva a cotação;
- o rascunho `proposal_tracking` já existente pode ser publicado explicitamente;
- backend gera token criptograficamente aleatório;
- somente SHA-256 do token fica persistido;
- o endereço completo é devolvido uma vez ao navegador para cópia e não é salvo no CRM;
- nova publicação do mesmo proposalId gira o token anterior;
- validade padrão: 90 dias;
- vendedor pode revogar o link.

### Página pública

Rota `/p/<token>` mostra apenas o snapshot sanitizado:
- empresa/contato;
- cidade/CNPJ quando presentes no snapshot;
- investimento;
- peças;
- condição/frete;
- configuração resumida;
- WhatsApp comercial.

Não renderiza:
- `clientId`;
- Código OG;
- operações;
- histórico interno;
- token de acesso do DUTRA OS;
- credenciais;
- dados fora do snapshot.

### Eventos confiáveis

O backend registra somente:
- `proposal.opened`;
- `proposal.reopened`;
- `proposal.contact_clicked`.

Regras:
- primeira sessão distinta = opened;
- nova sessão distinta = reopened;
- refresh da mesma sessão é deduplicado;
- clique de WhatsApp é evento explícito;
- nenhum IP/User-Agent é persistido;
- sessionId não sai pela API interna de eventos;
- eventos entram no CRM somente pela API protegida e alimentam Signal Center.

`proposal.sent` permanece ação humana explícita no DUTRA OS.

## Segurança

- token bruto nunca é gravado em `shared-state.json`, `localStorage` ou `public-proposals.json`;
- store público persiste somente hash SHA-256;
- payload público limitado a 10 KB;
- rate limit de engajamento;
- CSP restritiva;
- `noindex/nofollow/noarchive`;
- `no-store`;
- Service Worker ignora `/p/` e `/public-api/`;
- API interna de publicar/revogar/eventos continua protegida pelo acesso existente do runtime hospedado;
- publicação exige domínio HTTPS configurado;
- sem CORS público.

## UX

Na Cotação:
- **Salvar** prepara o rascunho;
- **Gerar link rastreável** publica e copia o endereço;
- **Confirmar envio** registra `proposal.sent` somente após confirmação humana;
- **Revogar link** invalida a URL;
- link bruto não fica persistido; para obter outro endereço, o vendedor gera um novo link.

## Persistência

O store de publicações usa `OG_DATA_DIR/public-proposals.json`. No Railway atual, `OG_DATA_DIR` aponta para o volume persistente `/data`.

Isso não transforma o JSON em banco multiusuário canônico; PROP-01B é uma fatia compatível com o runtime atual. SCALE-01 continua responsável por Auth/Organization/Postgres canônicos.

## Testes

- store: hash/token, expiração, dedupe, reopen, click e revoke;
- runtime HTTP sintético completo;
- ausência de clientId/Código OG na página;
- CSP/robots;
- PWA não cacheia páginas públicas;
- segurança/browser não persiste token;
- `npm run validate`;
- Brain, Security, npm audit e Release Gate no CI.

## Rollback

Reverter o pacote remove as rotas/UX novas. `public-proposals.json` é independente do estado comercial e pode permanecer inerte; nenhum lead, quote ou atividade existente precisa ser migrado ou apagado.

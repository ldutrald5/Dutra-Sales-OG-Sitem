# DUTRA OS / Sistema OG — Repository Instructions

## Missão
Este repositório contém o Sistema OG, um Sistema Operacional Comercial + Centro de Inteligência de Vendas para a operação Olho de Gato. O objetivo é reduzir trabalho manual do vendedor, preservar contexto da conta e transformar fatos comerciais em próxima ação útil.

Fluxo principal:
Encontrar → Pesquisar → Abordar → Diagnosticar → Propor → Acompanhar → Negociar → Vender → Expandir → Fidelizar → Indicações.

## Boot obrigatório
Antes de modificar código:
1. Leia `AGENTS.md`.
2. Leia `DUTRA_OS_CONTEXT.md` e `AI_HANDOFF.md`.
3. Consulte `docs/AI-CONTEXT-INDEX.md` e carregue somente os documentos do escopo.
4. Inspecione o código existente antes de criar nova abstração, entidade ou persistência.
5. Use `tasks/TODO.md` e a story aplicável quando houver.

## Fonte da verdade
- Código compartilhável: GitHub.
- Aplicação: `apps/sistema-og/`.
- Cadastro operacional atual: `state.leads` / `lead.id`.
- Documentação de domínio: `docs/`.
- Conhecimento comercial/técnico: `apps/sistema-og/knowledge/`.
- Dados reais importados e segredos NÃO pertencem ao Git.

Nunca trate ZIP, GitHub e runtime hospedado como sincronizados sem verificação explícita.

## Princípios
- O vendedor não deve trabalhar para alimentar o CRM; o sistema acompanha o trabalho.
- Reutilize a mesma conta/lead em CRM, Prospecção, Mesa, Agenda, Cotação e Call AI.
- Poucos cliques e pouco texto nas ações frequentes.
- Local-first/offline é requisito.
- Evolução incremental; não reescreva o app por conveniência.
- Solução determinística antes de IA.
- IA recebe contexto mínimo relevante, não o CRM inteiro.
- Ausência de dado = desconhecido. Nunca invente CNPJ, contato, frota, preço, aplicação, garantia, economia, venda ou resultado.

## Semântica comercial obrigatória
Ações e resultados são eventos diferentes:
- abrir WhatsApp != mensagem enviada;
- gerar cotação != proposta enviada;
- ter Código OG != ser cliente;
- sugestão de IA != fala do cliente;
- tentativa de contato != conversa;
- reunião sugerida != reunião marcada.

Nunca avance estágio silenciosamente. Ação externa, gravação, envio e gravação de conclusão no CRM exigem confirmação humana.

## Prioridade comercial
O produto deve favorecer:
1. próxima ação clara;
2. acesso rápido ao decisor;
3. marcação e preparação de reuniões para vendas consultivas;
4. fila de prospecção sem caça manual de números;
5. histórico confiável;
6. follow-up;
7. proposta/ROI rastreável;
8. expansão e indicação.

O discador/fila deve reduzir troca de tela, mas nunca registrar ligação, resultado ou mensagem sem confirmação observável.

## Arquitetura
Stack atual: JavaScript nativo, Node, PWA, localStorage, IndexedDB, service worker, servidor local e opção Cloudflare Worker/KV. Não presuma React, Vue, banco SQL ou Supabase apenas porque foram discutidos; valide o código e os ADRs antes de introduzir infraestrutura.

Preserve:
- compatibilidade de dados;
- migrações aditivas/reversíveis;
- operação offline;
- APIs e serviços existentes;
- dados persistidos do usuário.

## Segurança
- Nunca commitar tokens, chaves, cookies, credenciais, arquivos .env reais ou dados privados de clientes.
- Nunca expor segredo em frontend/localStorage.
- `.env.example` contém apenas nomes/exemplos seguros.
- Alterações de autenticação, produção, Railway/Cloudflare, storage e permissões exigem análise de impacto.
- Dados reais de CRM devem permanecer fora do repositório.

## Qualidade
Antes de concluir, use somente comandos que existam no repositório. Para mudança geral do OG, execute no mínimo `npm run og:check`; use os gates definidos em `AGENTS.md` quando aplicáveis. Não declare teste aprovado sem execução real.

Definition of Done: implementação + validação + documentação afetada + changelog/roadmap quando necessário + riscos/pendências explícitos.

## Como responder/implementar
Separe FATO, REGRA e SUGESTÃO quando houver inteligência. Prefira pequenos módulos, contratos claros e testes. Se informação necessária não estiver confirmada, marque `[CONHECIMENTO PENDENTE]` ou `Necessária validação técnica` em vez de completar por plausibilidade.

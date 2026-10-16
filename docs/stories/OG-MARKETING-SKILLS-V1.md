# OG-MARKETING-SKILLS-V1 — integração textual local

Status: validado localmente, pronto para revisão; sem publicação.

## Autorização e baseline

Autorização do usuário: implementar adaptadores textuais em rascunho, testar com dados fictícios e, após validação, criar apenas um commit local. Não fazer push, PR, merge, deploy, scraping, gastos, publicação ou envio de mídia.

Branch: `chore/og-marketing-skills-integration`.
Entrada verificada: `ea63126b5b1d105fe06011c60ee592f2074e6c1c`, CLEAN, sem conflitos. As 33 skills em `.codex/skills/` permanecem intactas. Os relatórios prévios são entradas de planejamento; as fontes e as licenças estão sendo verificadas novamente.

## Escopo e valor

Reutilizar capacidades de entrevista/revisão, planejamento e redação de Instagram, com handoff documental de vídeo. Os owners existentes `dutra-content-studio`, `dutra-video-studio` e `dutra-prompt-architect` permanecem responsáveis pelos seus domínios. Não há integração ao CRM, ao runtime ou à persistência do produto.

## Critérios de aceite

- [x] Pré-check de branch, SHA, árvore e 33 hashes existentes.
- [x] Fontes fixadas, blobs e MIT verificados; atribuição incluída.
- [x] Grill Me resolve grilling por arquivo local ou oferece handoff honesto.
- [x] Nove skills Instagram adaptadas, incluindo humanizer independente de trechos com proveniência incerta.
- [x] Adaptador Higgsfield documental, sem pressupor conector no editor.
- [x] Invocação explícita, rascunho e nenhuma ação externa permitida na V1.
- [x] Arquivos, referências, nomes, licenças e links verificados estaticamente.
- [x] Tarefas fictícias exercitadas por leitura explícita; limites de host registrados.
- [x] Rollback ensaiado somente com cópias dos arquivos novos.
- [x] Gates relevantes executados em cópia isolada, sem segredos ou dados reais.
- [x] Revisão independente e evidências registradas; um commit local, sem push.

## Plano de teste

Executar `node scripts/test_marketing_skills_contract.mjs` para contratos e rollback em fixture descartável. Exercitar as 12 entradas por leitura explícita com tarefas fictícias e revisar os resultados. Isso não comprova descoberta automática nos editores.

Executar lint, intelligence e brain check. A suíte completa do projeto, quando executada, deve usar cópia de arquivos versionados + novos arquivos deste pacote, dependências já existentes somente leitura, ambiente vazio e namespace de rede isolado. Não herdar `OG_DATA_DIR`: o teste hospedado existente prioriza essa variável sobre seu próprio mount temporário. O teste novo possui seu próprio diretório temporário de dados.

## Segurança e rollback

Markdown e metadados orientam o agente; não implementam sandbox, autorização de servidor ou garantia contra prompt injection. Serviços externos permanecem desconfigurados. Cada ação externa futura exige autorização específica e verificação no host.

O ensaio remove apenas os arquivos novos listados no manifesto de uma cópia temporária, preservando um sentinela preexistente. No checkout de trabalho, não executar limpeza recursiva, reset ou exclusão de `.data`. Após o commit, eventual reversão é `git revert <commit-deste-pacote>`, mediante autorização, preservando dados e commits anteriores.

## Evidências e file list

A documentação operacional e a lista exata de arquivos novos ficam em `docs/integrations/MARKETING_SKILLS_ADAPTERS.md` e `docs/integrations/marketing-skills.sources.json`. Resultados executados e limites estão abaixo; descoberta automática e providers permanecem NÃO TESTADO.


## Resultados executados — 16/10/2026

| Verificação | Resultado | Evidência |
|---|---|---|
| Fontes fixadas, árvores/blobs e MIT | PASSOU | 5 arquivos Matt + 27 Instagram, hashes no manifesto; nenhum código upstream executado. |
| Contrato novo, links locais, nomes, política e licenças | PASSOU | 21 verificações em `scripts/test_marketing_skills_contract.mjs`. URLs HTTPS foram verificadas sintaticamente; fontes oficiais foram acessadas e verificadas. Não é um crawl de todos os links de referência. |
| Preservação das 33 skills anteriores | PASSOU | Hashes atuais iguais ao baseline verificado; nenhum arquivo dessas skills alterado. |
| Rollback somente de arquivos novos | PASSOU | Fixture descartável preservou 33 contratos e sentinela; recusou traversal, caminho absoluto e symlink. Nenhum rollback no checkout real. |
| Ativação contextual por leitura explícita | PASSOU | 12/12 tarefas fictícias com saídas efetivamente produzidas por agente e revisadas pelo responsável. |
| Cenários adversariais textuais | PASSOU | 5/5: chave fictícia não habilita ação, conta B invalida aprovação para A, timeout sem retry, menção não ativa e contexto A não passa para B. Injeção também exercitada na tarefa de legenda. Não prova enforcement. |
| `npm run lint` | PASSOU | Executado isoladamente; checagem sintática. |
| `npm test` | PASSOU | 83/83 gates na execução final isolada; inclui intelligence, brain, release, CRM, propostas, sync, hosted e preview. Não inclui todos os testes browser existentes. |
| `npm run og:brain:refresh` | PASSOU | 206 registros, zero avisos; índice/métricas atualizados. |
| Revisão independente | PASSOU | Dois revisores, sem bloqueio remanescente; corrigidos falsos positivos no verificador e harmonizado escopo de screenshots autorizados. |
| Descoberta/menus nativos Codex, Cursor, VS Code | NÃO TESTADO | Ensaio foi contextual/manual nesta sessão. Não se executou CLI de modelo nem instalação de extensão/plugin. |
| Providers, mídia, publicação, scraping e gasto | NÃO TESTADO | Desativados e fora do escopo; nenhum job/upload/post/contato/ação real. |

As evidências completas locais ficam em `/workspace/artifacts/OG-MARKETING-SKILLS-V1-20261016/`: `source-verification.json`, `contract.log`, `activation-contextual.json`, `lint.log`, `full.log`, os metadados JSON de isolamento e `run_isolated.py`.

O runner usa Bubblewrap com namespace de rede privado, apenas loopback, cópia descartável dos arquivos versionados + novos, dependências existentes somente leitura, ambiente vazio e usuário/home sintéticos. O workspace original, `.env`, `.data`, credenciais e volumes comerciais não são montados. O teste novo recebe `OG_DATA_DIR` temporário; na suíte existente essa variável não é herdada, permitindo que cada fixture controle seu diretório.

Duas falhas de preparação foram preservadas nos logs: npm sem cadastro de usuário no filesystem mínimo (`uv_os_homedir ENOENT`) e 82/83 gates quando o runner forçava `OG_HOST=127.0.0.1`. Essa variável desativa o modo LAN esperado pelo teste de acesso hospedado (200 em vez de 401). O runner foi corrigido com passwd/home sintéticos e sem override de host; o teste ficou confinado ao namespace de rede. A execução final passou 83/83 sem alterar servidor, autenticação ou testes existentes.

## Limites de aceite

- Segurança descrita nas skills é orientação ao agente, não sandbox ou autorização de servidor. Cada operador precisa restringir ferramentas e rede no host real.
- Humanizer é adaptação independente; não remove proveniência nem garante detectar autoria por IA.
- Sem métricas atuais de Instagram, alegações técnicas OG novas, pesquisa de contas ou mídia produzida.
- O novo teste é invocado diretamente; não foi adicionado ao `package.json`/CI nesta integração mínima.
- Não se autoriza publicação por ter passado neste pacote. Nenhuma configuração de provider, preço ou permissão foi modificada.

## Checkpoint e continuidade

Checkpoint de entrada: `ea63126b5b1d105fe06011c60ee592f2074e6c1c`. A entrega deve ser um único commit local `feat(agent-skills): add draft-only OG marketing adapters`; seu SHA exato é entregue no relatório final e no artefato de fechamento externo, evitando autorreferência de hash. Não há push/PR/merge/deploy. Para reversão futura, revisar e autorizar `git revert <SHA-do-pacote>`; sem exclusão de dados ou de diretórios compartilhados.

Próxima ação opcional, com nova autorização: validar a descoberta explícita no editor efetivamente usado, sem adicionar credenciais ou habilitar providers. Não ampliar a V1 para execução externa.

## File list desta entrega

### Novos arquivos

- `.agents/skills/grill-me/SKILL.md`
- `.agents/skills/grill-me/agents/openai.yaml`
- `.agents/skills/grilling/SKILL.md`
- `.agents/skills/grilling/agents/openai.yaml`
- `.agents/skills/ig-audience-insights/SKILL.md`
- `.agents/skills/ig-audience-insights/agents/openai.yaml`
- `.agents/skills/ig-caption-writer/SKILL.md`
- `.agents/skills/ig-caption-writer/agents/openai.yaml`
- `.agents/skills/ig-carousel-planner/SKILL.md`
- `.agents/skills/ig-carousel-planner/agents/openai.yaml`
- `.agents/skills/ig-content-planner/SKILL.md`
- `.agents/skills/ig-content-planner/agents/openai.yaml`
- `.agents/skills/ig-hashtag-strategist/SKILL.md`
- `.agents/skills/ig-hashtag-strategist/agents/openai.yaml`
- `.agents/skills/ig-hook-extractor/SKILL.md`
- `.agents/skills/ig-hook-extractor/agents/openai.yaml`
- `.agents/skills/ig-humanizer/SKILL.md`
- `.agents/skills/ig-humanizer/agents/openai.yaml`
- `.agents/skills/ig-profile-optimizer/SKILL.md`
- `.agents/skills/ig-profile-optimizer/agents/openai.yaml`
- `.agents/skills/ig-repurposer/SKILL.md`
- `.agents/skills/ig-repurposer/agents/openai.yaml`
- `.agents/skills/og-ad-multiplier-handoff/SKILL.md`
- `.agents/skills/og-ad-multiplier-handoff/agents/openai.yaml`
- `.agents/third-party-licenses/instagram-skills.MIT.txt`
- `.agents/third-party-licenses/mattpocock-skills.MIT.txt`
- `docs/integrations/HIGGSFIELD_AD_MULTIPLIER_HANDOFF.md`
- `docs/integrations/MARKETING_SKILLS_ADAPTERS.md`
- `docs/integrations/marketing-skills.sources.json`
- `docs/stories/OG-MARKETING-SKILLS-V1.md`
- `scripts/test_marketing_skills_contract.mjs`
- `tests/fixtures/marketing-skills/activation-cases.json`

### Arquivos existentes atualizados somente para documentação

- `AI_HANDOFF.md`
- `CHANGELOG.md`
- `DUTRA_OS_CONTEXT.md`
- `docs/second-brain/BRAIN_INDEX.md`
- `docs/second-brain/BRAIN_METRICS.md`
- `docs/second-brain/cycles.jsonl`
- `docs/second-brain/decisions.jsonl`
- `docs/second-brain/sources.jsonl`

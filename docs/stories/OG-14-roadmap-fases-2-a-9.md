# OG-14 — Roadmap executável das fases 2 a 9

## Status

Roadmap — as fases viram stories próprias somente ao entrar em refinamento

## Propósito

Desdobrar o épico OG-10 e a missão operacional em uma sequência verificável após a fundação OG-11/12/13. Este documento organiza entregas e dependências; não autoriza preencher dados, conteúdos ou regras ainda não fornecidos.

## Regras de entrada comuns

Antes de iniciar qualquer fase:

- [ ] Story própria criada por `@po`/`@sm`, com critérios testáveis e File List inicial.
- [ ] Dependências da fase concluídas ou exceção registrada.
- [ ] Modelo de dados impactado revisado.
- [ ] Dados reais permanecem fora do Git.
- [ ] Migração é aditiva e possui teste/backup quando houver persistência nova.
- [ ] Nenhuma função externa envia, publica, grava ou altera dados sem ação explícita.
- [ ] Conteúdo ausente aparece como rascunho, bloqueado ou “dados insuficientes”.

## Sequência e dependências

```text
OG-11 Arquitetura/modelo
   ├── OG-12 Migração/validação
   └── OG-13 Navegação/componentes/testes
            ↓
F2 Biblioteca → F3 CRM/Call AI ─────────┐
      │                                 ├→ F4 Performance/Funil
      └→ F7 Modelos comerciais ─────────┤
                                        └→ F5 Vendas/Documentos/Comissões
F1 Fundação → F6 Transportadoras
F1 Fundação + folha oficial → F8 Árvore técnica
F1 Fundação + backend seguro + regras → F9 Usuários/Time
```

Fases independentes podem avançar em paralelo somente quando não alterarem o mesmo contrato ou arquivo sem coordenação.

---

## Fase 2 — Biblioteca Comercial

**Status:** Ready for Review — implementada na OG-15.

### Resultado

Galeria local-first capaz de cadastrar, localizar, visualizar e classificar materiais comerciais sem transformar a biblioteca em uma pasta desorganizada.

### Escopo mínimo da futura story

- Material com metadados, fonte, versão, autorização, status e aplicabilidade.
- Vídeo, imagem, PDF, apresentação, link, áudio, script e mensagem.
- Galeria, pesquisa, filtros, favoritos, recentes e prévia.
- Estados rascunho, aprovado, desatualizado e arquivado.
- Separação entre conteúdo interno e autorizado para cliente.
- Importação auditável e validação de metadados.

### Critérios de saída

- [x] Material pode ser cadastrado e recuperado por ID estável.
- [x] Busca cobre segmento, etapa, dor, objeção, decisor, produto e veículo; filtros dedicados cobrem tipo, status e permissão.
- [x] Prévia falha com segurança quando mídia está ausente.
- [x] Consentimento/permissão é visível antes de “Usar com cliente”.
- [x] Nenhum envio é automático.
- [x] Materiais desatualizados podem ser localizados e auditados pelos metadados.

### Dependências

OG-11, OG-12 e componentes da OG-13. Conteúdo real e autorizações podem chegar gradualmente.

### Stories sugeridas no refinamento

- Catálogo e importação de materiais.
- Galeria, pesquisa, filtros e prévia.
- Favoritos, recentes, status e auditoria.

---

## Fase 3 — CRM, Call AI e pacotes de materiais

### Resultado

Recomendar material com base no contexto registrado, montar pacote revisável e registrar o que foi enviado ao cliente.

### Escopo mínimo da futura story

- Materiais recomendados na ficha do cliente e no Call AI.
- Regras iniciais editáveis por segmento, dor, etapa, objeção e decisor.
- Pacote contendo vídeo, prova visual, caso, ficha, estudo e mensagem quando disponíveis.
- `MaterialShare` com canal, destinatário, data, negociação, resultado e próxima ação.
- Histórico do pacote e revisão antes de copiar/compartilhar.

### Critérios de saída

- [ ] Recomendação informa por que o material foi sugerido.
- [ ] Ausência de conteúdo compatível gera estado vazio honesto.
- [ ] Pacote pode ser revisado e alterado antes de uso.
- [ ] Registro de envio não afirma abertura ou visualização sem sinal técnico.
- [ ] Call AI continua funcional sem áudio e sem IA externa.
- [ ] Gravação permanece manual e local.

### Dependências

Fase 2 concluída; cliente canônico e interações migrados; regras comerciais revisadas.

### Stories sugeridas no refinamento

- Recomendações contextuais.
- Construtor de pacotes.
- Histórico e registro de compartilhamento.
- Integração com Call AI.

---

## Fase 4 — Performance e Funil

### Resultado

Central de Performance & Operações baseada em eventos reais, com visão por período e distinção clara entre atividade, oportunidade, venda, faturamento e comissão.

### Escopo mínimo da futura story

- Catálogo e emissão de `ActivityEvent`.
- Funil: Novo lead → Contatado → Diagnóstico → Proposta → Negociação → Venda → Pós-venda.
- Quantidade, valor, conversão e tempo por etapa.
- Produção comercial e comparações mensais.
- Filtros por período, vendedor, segmento, status, estado, produto, parceiro e origem.
- Estados “dados insuficientes” e ausência de histórico.

### Critérios de saída

- [ ] Todos os indicadores exibem fórmula, período e fonte dos dados.
- [ ] Abertura de WhatsApp não avança etapa nem conta contato concluído.
- [ ] Dashboard não usa números simulados quando há dados reais.
- [ ] Conversão evita divisão inválida e informa base pequena.
- [ ] Funil permite identificar negócios parados sem alterar sua etapa automaticamente.
- [ ] Visualizações possuem alternativa textual acessível.

### Dependências

OG-11 (eventos), OG-12, OG-13 e eventos suficientes dos módulos ativos.

### Stories sugeridas no refinamento

- Instrumentação de eventos.
- Funil e aging.
- Dashboard mensal e produção.
- Filtros, acessibilidade e exportação resumida.

---

## Fase 5 — Vendas, documentos, planilhas e comissões

### Resultado

Registrar venda separadamente de cotação, calcular comissão por regra explícita e gerar documentos/exportações após revisão.

### Escopo mínimo da futura story

- `Sale`, `Partner`, `Commission`, `GeneratedDocument` e vínculo com cotação/cliente.
- Status de venda, faturamento, pagamento e comissão sem mistura de conceitos.
- Prévia, exportação e impressão.
- Exportações estruturadas de clientes, atividades, cotações, vendas, comissões, parceiros, materiais e indicadores.
- Auditoria de alterações e versões de documentos.

### Critérios de saída

- [ ] Venda guarda origem e não sobrescreve cotação.
- [ ] Comissão sempre mostra regra, base, percentual/valor e arredondamento aplicados.
- [ ] Documento exige conferência antes de baixar ou imprimir.
- [ ] Geração falha com mensagem clara quando campo obrigatório estiver ausente.
- [ ] Importação/exportação não substitui dados silenciosamente.
- [ ] Fórmulas, totais e vínculos têm testes automatizados.

### Dependências e bloqueios

- OG-11/12/13 e, para métricas, Fase 4.
- PDF e planilha oficiais para reprodução fiel.
- Regras de comissão oficiais para cálculo final.
- Sem esses materiais, somente estrutura, rascunhos e validadores podem ser liberados.

### Stories sugeridas no refinamento

- Registro de venda e parceiro.
- Motor transparente de comissão.
- Mapeamento e geração do PDF oficial.
- Importação/exportação da planilha oficial.
- Impressão, auditoria e validação visual.

---

## Fase 6 — Transportadoras e mapa de cobertura

### Resultado

Base pesquisável de transportadoras com contatos, cobertura, mapa e evidências oficiais datadas.

### Escopo mínimo da futura story

- Cadastro de transportadora, bases/filiais, telefones, site, modalidades e cobertura.
- Fonte, data e status de verificação por informação relevante.
- Pesquisa em fontes oficiais.
- Mapa do Brasil por estados, legenda, interação e alternativa textual.
- Ações de ligar, abrir site e iniciar cotação de frete.

### Critérios de saída

- [ ] Cobertura não é inferida a partir de uma filial.
- [ ] Informação sem comprovação aparece como “a verificar”.
- [ ] Site e telefone possuem fonte e data de verificação quando exigido.
- [ ] Mapa e lista textual apresentam a mesma cobertura.
- [ ] Clicar em estado ou transportadora não perde contexto dos filtros.
- [ ] Interface funciona no celular e sem carregamento do mapa.

### Dependências

OG-11/12/13. Pesquisa web deve ocorrer durante a story própria e priorizar fontes oficiais.

### Stories sugeridas no refinamento

- Modelo, importação e validação de fontes.
- Pesquisa e ficha da transportadora.
- Mapa acessível de cobertura.
- Auditoria de links e dados desatualizados.

---

## Fase 7 — Modelos comerciais de mensagem e PDF

### Resultado

Duas galerias visuais, preparadas para até dez modelos cada, com seleção, prévia, versionamento, adaptação e aprovação.

### Escopo mínimo da futura story

- `MessageTemplate`, `QuoteTemplate`/`DocumentTemplate` e versões.
- Nome, finalidade, público, segmento, etapa, tom, tamanho, campos e status.
- Galeria visual, filtros, prévia e validação de campos.
- Fluxo selecionar → adaptar → revisar → copiar/gerar.
- Slots não definidos em rascunho.

### Critérios de saída

- [ ] Modelos são identificados por nome e finalidade, não por botões numéricos isolados.
- [ ] Rascunho não se apresenta como conteúdo aprovado.
- [ ] Campo dinâmico ausente é mostrado para correção antes da geração.
- [ ] Mensagem nunca é enviada automaticamente.
- [ ] PDF possui prévia antes de baixar/imprimir.
- [ ] Versão usada fica registrada no artefato gerado.

### Dependências e bloqueios

Fase 2 para experiência de galeria; Fase 5 para documentos operacionais. Conteúdo definitivo depende de aprovação de Lucas e dos modelos oficiais.

### Stories sugeridas no refinamento

- Galeria e editor controlado de mensagens.
- Galeria e prévia de PDFs.
- Versionamento, aprovação e campos dinâmicos.

---

## Fase 8 — Árvore técnica de veículos e aplicações

### Resultado

Base técnica rastreável para veículo, roda, eixo, equalizador, suporte e mangueira, liberando recomendação somente para combinações confirmadas.

### Condição obrigatória de entrada

- [ ] Folha oficial de aplicação recebida e legível.
- [ ] Extração revisada por pessoa responsável.
- [ ] Fonte/versionamento definidos.

### Escopo mínimo da futura story

- Caminhão, cavalo, carreta, ônibus, micro-ônibus e van.
- Marca, modelo, ano, configuração, roda, eixo, pressão, equalizador, suporte, mangueira, quantidade e código.
- Fonte técnica e status de validação.
- Importação, revisão humana e testes por combinação.

### Critérios de saída

- [ ] Toda aplicação liberada aponta para fonte e versão oficiais.
- [ ] Combinação não confirmada permanece bloqueada.
- [ ] Sistema não deduz mangueira, suporte ou código por semelhança.
- [ ] Alteração da fonte invalida ou solicita revisão das regras afetadas.
- [ ] Cada combinação liberada possui teste.
- [ ] Cotação automática não usa aplicação em estado pendente.

### Dependências

OG-11/12/13 e material oficial. Sem a folha, esta fase permanece bloqueada; somente o contrato estrutural da OG-11 pode avançar.

### Stories sugeridas no refinamento

- Digitalização e revisão da folha oficial.
- Catálogo de veículos/componentes.
- Motor de aplicação validada.
- Integração segura com cotação.

---

## Fase 9 — Usuários, permissões, metas e visão do time

### Resultado

Acesso multiusuário seguro com dados individuais e visão consolidada conforme papel.

### Condições obrigatórias de entrada

- [ ] Backend e estratégia de autenticação aprovados por arquitetura e segurança.
- [ ] Usuários, papéis, política de acesso e recuperação definidos.
- [ ] Regras de meta e visibilidade aprovadas.

### Escopo mínimo da futura story

- Perfis vendedor, gestor, administrador e financeiro; parceiro somente se aprovado.
- Sessão segura, autorização no servidor e isolamento por usuário.
- Metas individuais/coletivas.
- Visão consolidada do time para papel autorizado.
- Auditoria das alterações sensíveis.

### Critérios de saída

- [ ] Interface não é a única barreira de permissão; autorização é aplicada na camada de dados/servidor.
- [ ] Vendedor acessa apenas o escopo definido pela política aprovada.
- [ ] Gestor vê o consolidado autorizado.
- [ ] Credenciais e tokens não aparecem em Git, logs ou armazenamento inadequado.
- [ ] Recuperação, expiração e saída de sessão são testadas.
- [ ] Dashboard do time usa somente dados reais e respeita filtros/permissões.

### Dependências e bloqueios

OG-11/12/13, backend seguro, política organizacional, Fase 4 para métricas e Fase 5 para vendas/comissões.

### Stories sugeridas no refinamento

- Autenticação e sessão.
- Autorização e escopo de dados.
- Metas.
- Dashboard do time.
- Auditoria e segurança.

---

## Matriz resumida de rastreabilidade

| Fase | Seções da missão | Entidades principais | Bloqueio externo |
|---|---|---|---|
| 2 | §§4, 5, 20–22 | Material | Conteúdo/autorização parcial |
| 3 | §§5, 6 | MaterialShare, MaterialPackage, Interaction, CallSession | Regras comerciais revisadas |
| 4 | §§7, 8, 22 | ActivityEvent, Client, Goal | Histórico suficiente para métricas |
| 5 | §§8, 9, 11, 12 | Sale, Commission, Partner, GeneratedDocument | PDF, planilha e comissão oficiais |
| 6 | §14 | Transporter, TransporterCoverage | Pesquisa/fonte oficial |
| 7 | §§9.1, 10 | MessageTemplate, QuoteTemplate, DocumentTemplate | Conteúdo aprovado |
| 8 | §16 | Entidades técnicas definidas em OG-11 | Folha oficial obrigatória |
| 9 | §§13, 17, 20 | User, Goal, ActivityEvent | Backend e política de acesso |

## Critérios de conclusão do roadmap

- [ ] Cada fase possui pelo menos uma story própria refinada antes de código.
- [ ] Critérios gerais da missão estão cobertos por uma fase e por testes.
- [ ] Entradas oficiais faltantes continuam visíveis como bloqueios, sem conteúdo inventado.
- [ ] A sequência é atualizada quando decisões arquiteturais mudarem dependências.
- [ ] O File List de cada story implementada reflete os arquivos realmente alterados.
- [ ] A documentação de OG-10 permanece como visão e histórico da primeira entrega.

## File List

- `docs/stories/OG-14-roadmap-fases-2-a-9.md`

## Change Log

| Data | Versão | Descrição | Autor |
|---|---:|---|---|
| 2026-09-23 | 0.1 | Roadmap rastreável criado a partir das fases 2–9 da missão | @po/@sm |

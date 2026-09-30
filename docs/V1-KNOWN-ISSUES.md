# V1 — riscos e pendências conhecidas

| Risco | Impacto | Tratamento |
|---|---|---|
| `app.js` ainda contém a implementação técnica histórica | duas referências durante a transição | extrair por fatias e manter testes de paridade |
| Railway V3 publica somente `preview-v2` | exige espelhos físicos | gates byte a byte; nenhum desenvolvimento direto no espelho |
| Backend hospedado é JSON | concorrência e multiusuário limitados | local-first + revisão de conflito; Supabase apenas após RLS |
| Exclusão/tombstones ainda incompletos | registro removido pode reaparecer no merge | não liberar exclusão definitiva na V1 inicial |
| Proposta usa ponte para tela madura | experiência ainda não é totalmente unificada | próxima etapa após carrinho técnico |
| Catálogo técnico tem cobertura parcial | risco de suporte incorreto | pendência explícita; vendedor decide e valida |
| Testes V3 são majoritariamente contratuais/estáticos | falhas visuais podem escapar | smoke autenticado no preview e E2E progressivo |

## Bloqueios para release oficial

- Suíte completa e release gate devem passar.
- Preview Railway precisa ser validado sem tocar na produção.
- Fluxos de cotação, proposta e persistência precisam de aceitação em celular e desktop.
- Nenhum dado real será migrado até existir backup, rollback e política de identidade definidos.

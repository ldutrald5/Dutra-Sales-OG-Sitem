# Proposal Experience — Design DNA / Impacto OG

Data: 2026-10-09. Stage 8.2, rodada 3. **A direção A — Impacto OG foi escolhida explicitamente por Lucas.** B/C ficam arquivadas como exploração; não são novas entregas ativas. Isto não elimina os templates funcionais Executivo/Técnico/Compacto da Stage 8.1.

## Intenção comercial

Presença, reconhecimento OG e compreensão rápida: problema → solução → aplicação na frota → investimento → benefício estimado → próximo passo. A abertura desperta interesse antes do detalhe técnico. O decisor identifica destinatário, problema resolvido e pneus atendidos em poucos segundos; esta é uma intenção de design, ainda sem teste com decisores.

## DNA escolhido

- Preto/carvão `#10151c`, amarelo OG `#ffdf00`, branco de leitura. Contraste e números grandes; não ornamentação excessiva.
- Tipografia sem serifa forte, títulos curtos e cifras legíveis; texto técnico em menor hierarquia, acessível progressivamente.
- Abertura preservada: caminhão forte, mensagem curta, nome do cliente e pneus atendidos; curva sutil que revela amarelo. Não carregar a primeira tela com preços ou tabelas.
- Composição: cards distintos de Cavalo e Carreta, identidade/configuração, quantidade de veículos, aplicação e subtotal. Quantidade de veículos permanece distinta de peças por veículo.
- Investimento: por veículo → subtotal do grupo → total, apenas conforme dado canônico. Eixo/conjunto pareado ficam VALIDAR quando falta contrato de rateio/vínculo.
- Economia: **manter a superfície amarela e o valor dominante**; faixa preta de complemento, curva discreta e referência ao olho. Estimativa, premissas e limitações continuam legíveis.
- CTA: validar composição e premissas; exportar/visualizar não significa enviar nem aceitar.
- Mobile: narrativa vertical, cards legíveis, detalhes expansíveis. Desktop: ocupar largura com seções/blocos sem uma coluna artificialmente estreita. Os três painéis da prévia são composição de revisão, não obrigação de layout final.

## Refinamentos produzidos, sujeitos à avaliação

Artefatos: `/workspace/artifacts/stage82-impacto-v3/`.

1. `A-tractor-card-mobile.png`: substitui o ícone simplista por ilustração conceitual de cavalo 4×2, dois eixos, sem carreta; cabeçalho preto, quantidade amarela e separação entre unitário/subtotal. A imagem foi gerada para exploração, não é foto real, prova de propriedade ou evidência de instalação. Sua incorporação ao produto exige revisão de uso/licença/formato e identificação adequada.
2. `A-economy-highlight-mobile.png`: mantém amarelo/valor e adiciona faixa preta com curva e olho discreto. A forma exata é proposta visual, não nova regra técnica.
3. `A-composition-mobile.png`, `A-return-mobile.png`, `A-mobile.png`, `A-desktop.png`, `index.html`: contexto completo verificável.

## Dados e limites

Mesmo exemplo fictício da rodada 2: Transportadora Horizonte, 2 cavalos 4×2 + 3 carretas de 3 eixos; 88 peças, 44 pneus, investimento R$ 6.490,00. Snapshot idêntico à rodada anterior: 7.685 bytes. Nenhum preço/peça/ID/ROI modificado.

18 meses = vida atual de pneu novo; 20% = aumento **estimado** da vida, não economia direta; 2% de combustível permanece hipótese. Custos fictícios geram R$ 1.014,81/mês pela função canônica. Aplicabilidade ao cliente real continua VALIDAR; não são defaults nem resultados comprovados.

Logo/foto somente por ativo autorizado e mesma identidade canônica; ausente mantém OG. Não colocar logo inventado ou representar um caminhão conceitual como frota real. Link narrado permanece `IDEA-PROPOSAL-NARRATED-LINK-001`, sem implementação/publicação.

## Próximo passo delimitado

A seleção de A está concluída. A avaliação pendente é do **novo card do cavalo e da faixa preta**, além dos dados/ativos de uma proposta real. Prompt futuro preparado em `docs/product/PROPOSAL_IMPACTO_OG_IMPLEMENTATION_PROMPT.md`; não executado nesta rodada. Sem mudanças em produto, produção, preços, persistência ou deploy.


## Revisão final / confirmação oficial

Lucas confirmou A como direção **oficial**; B/C são histórico sem alternativa ativa. Revisão final: `PROPOSAL_IMPACTO_OG_FINAL_REVIEW.md`, capturas `/workspace/artifacts/stage82-impacto-final/`. Imagem de 4×2 não se aplica automaticamente a 6×2/6×4; sem mídia compatível, omitir desenho e manter descrição/dados, sem invalidar técnica válida. Investimento/ROI/snapshot iguais, seis casos de mídia e contraste conferidos. Recomendação: aprovar pacote visual para implementação; aguardar autorização explícita. Nenhuma integração/deploy nesta rodada.

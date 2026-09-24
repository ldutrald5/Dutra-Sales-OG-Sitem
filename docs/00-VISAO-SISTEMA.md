# Visão do Sistema OG

## Propósito

O Sistema OG — Centro de Inteligência Comercial deve evoluir de CRM leve para **Sistema Operacional Comercial + Centro de Inteligência de Vendas**. A conta é a unidade central; o vendedor trabalha a partir da próxima ação e o sistema registra o mínimo necessário ao longo do fluxo.

```text
Encontrar → Pesquisar → Abordar → Diagnosticar → Propor → Acompanhar
          → Negociar → Vender → Expandir → Fidelizar → Gerar indicações
```

Ao redor da empresa existem contatos, oportunidades, atividades, histórico, ligações, mensagens, e-mails, propostas, pesquisas, tarefas, follow-ups, arquivos, inteligência comercial e Call AI.

## Princípios

- O vendedor não trabalha para alimentar o CRM; o sistema acompanha o trabalho.
- Ações frequentes devem exigir poucos cliques e pouco texto.
- Nenhum resultado comercial é presumido: abrir, preparar e enviar são fatos diferentes.
- O sistema continua útil sem IA e sem conexão.
- Informação comercial ou técnica sem fonte não vira fato.
- Desktop é a superfície principal de operação; celular mantém os fluxos críticos.

## Estado atual

A aplicação já reúne Meu Dia, CRM, Call AI, cotação, consultor de suportes, transportadoras, ROI, Biblioteca Comercial, Performance e histórico. Ela funciona como PWA local-first, sincroniza estado com servidor local ou Cloudflare e preserva dados no navegador.

## Direção

A **Mesa de Vendas** será a interface operacional principal. Ela reunirá fila, conta ativa, ações rápidas, histórico e próxima ação sem obrigar o vendedor a trocar de tela. Os módulos especializados continuarão disponíveis e trabalharão sobre a mesma identidade de conta.

## Limites atuais

- Não existe integração automática com WhatsApp.
- Não existe transcrição automática de chamadas.
- A autenticação e as permissões multiusuário ainda não estão consolidadas.
- O modelo normalizado de Company/Contact/Opportunity ainda é destino arquitetural, não realidade integral.
- Regras oficiais de produto, preço, garantia e aplicação permanecem em `knowledge/` como pendentes quando não comprovadas.

Documentos relacionados: [arquitetura](01-ARQUITETURA.md), [CRM](04-CRM.md), [Mesa de Vendas](05-MESA-DE-VENDAS.md) e [roadmap](10-ROADMAP.md).

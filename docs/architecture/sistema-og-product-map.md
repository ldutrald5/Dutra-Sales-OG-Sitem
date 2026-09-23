# Mapa de Produto — Sistema OG 2026

## Objetivo

Transformar o Sistema OG em uma central comercial única para cadastrar, priorizar, ligar, diagnosticar, cotar e acompanhar clientes sem duplicar dados entre telas.

## Princípio estrutural

O cliente é uma entidade única. Meu Dia, Leads/Transcrição, Call AI, Cotação, ROI e Histórico apenas exibem ou enriquecem o mesmo registro.

```text
Cadastro rápido / OCR / importação
               │
               ▼
          Cliente único
      ┌────────┼─────────┐
      ▼        ▼         ▼
   Meu Dia   Call AI   Cotação
      │        │         │
      └────────┼─────────┘
               ▼
        Histórico e próximo passo
```

## Módulos e responsabilidades

### 1. Meu Dia

- Fila operacional por prioridade e data.
- Cadastro rápido de cliente ainda inexistente.
- Abertura direta da ficha completa, Call AI ou cotação.

### 2. Leads e Transcrição

- Cadastro manual, importação em lote e OCR.
- Registro mestre do cliente, contato, segmento, frota, dor, decisor e histórico.
- Evitar duplicação por telefone, CNPJ e combinação empresa/cidade em uma evolução posterior.

### 3. Call AI

- Estado 1: escolher ou cadastrar cliente.
- Estado 2: escolher objetivo.
- Estado 3: preparar e exibir contexto, roteiro em oito etapas, objeções, anotações e gravação.
- Áudio permanece local; transcrição é uma fase separada.

### 4. Transportadoras

Cada registro deverá aceitar:

- nome, código interno, telefones e site oficial;
- regiões, estados e cidades atendidas;
- origem/base, modalidades, prazo ou frequência quando confirmado;
- mapa do Brasil com estados destacados;
- data de verificação e fontes oficiais.

Dados não confirmados devem aparecer como “a verificar”. O sistema não deve inferir cobertura.

### 5. Central de Vendas e ROI

- Premissa de vida útil atual do pneu: **18 meses**.
- Cenário com OG: 18 meses × ganho informado.
- Exibir premissas, cenário atual, cenário com OG, economia, payback e impacto por segmento.
- Presets futuros por transportadora, ônibus, micro-ônibus, van, agronegócio, mineração e demais segmentos.

### 6. Cotação e biblioteca de modelos

- Um seletor visual para mensagens e outro para PDFs.
- Biblioteca preparada para dez modelos de cada tipo.
- Cada modelo terá nome, finalidade, público, campos exigidos, prévia e versão.
- Modelos ainda não definidos ficam em rascunho e não podem gerar conteúdo inventado.

### 7. Árvore técnica de veículos e suportes

- Incluir caminhões, cavalos, carretas, ônibus, micro-ônibus e vans.
- Separar veículo, eixo, roda, suporte, mangueira, equalizador e quantidade.
- Micro-ônibus e vans já existem como segmentos comerciais; a regra técnica de peças será ativada somente depois da validação da folha oficial.
- Nenhum código de suporte ou mangueira pode ser deduzido sem fonte técnica confirmada.

## Ordem de entrega

1. Cadastro rápido unificado e clareza do Call AI.
2. ROI com ciclo-base de 18 meses.
3. Biblioteca visual de mensagens e PDFs.
4. Cadastro enriquecido e mapa das transportadoras.
5. Central de Vendas por segmento.
6. Árvore técnica completa após receber a folha oficial de aplicações.

## Decisões e limites

- Local-first e PWA continuam válidos.
- Dados reais permanecem fora do Git.
- Links e coberturas de transportadoras exigem fonte verificável.
- Regras técnicas de produto exigem documento oficial da Olho de Gato.
- Toda gravação, importação ou alteração de CRM depende de ação explícita do usuário.


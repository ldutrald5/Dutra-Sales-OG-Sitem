# PROJECT-CONTEXT — Sistema OG / Dutra Sales OG

Documento para humanos e IAs que forem continuar o projeto.

## 1. O que é o Sistema OG

Aplicação web local-first para o vendedor da **Olho de Gato** (equalizadores de pneu / frota).
Centraliza cotação, CRM leve, fila do dia e orientação comercial **sem** depender de API de IA para funcionar.

## 2. Objetivo comercial

- Registrar leads e próximos passos
- Não perder retorno (Meu Dia)
- Gerar cotação multi-veículo e mensagens WhatsApp revisáveis
- Apoiar diagnóstico a partir dos **dados registrados**

## 3. Arquitetura atual

Browser (PWA) + `server.mjs` (Node :4321) + opcional Cloudflare Worker/KV e Tunnel.

## 4–10. Frontend, servidor, CRM, persistência, sync, mobile, PWA

Ver pasta `apps/sistema-og/` e README do app. Estado local em `.data/` (não versionado).

## 11. Regras para não quebrar dados

- Não apagar localStorage de usuários
- Não versionar `.data/` nem JSON de leads reais
- Migrações aditivas; WhatsApp abrir ≠ contato feito

## 12. Como testar

```bash
npm install
npm run og:check
npm run og:start
```

## 13. Roadmap

| ID | Tema | Status |
|----|------|--------|
| OG-1 | Copiloto Comercial | Implementado |
| OG-2 | Modernização visual | Implementado |
| OG-3 | Call AI Assistente Comercial | Implementado em modo manual com Sales Brain local |
| OG-4 | Áudio | Planejado |
| OG-5 | Transcrição | Planejado |
| OG-6 | Sales Intelligence AI | Planejado |
| OG-7 | Integração CRM avançada | Planejado |
| OG-8 | Live Call Copilot | Planejado |
| OG-9 | Analytics | Planejado |

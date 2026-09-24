# Olho de Gato (OG) — Versão Mobile 📱

> **CONGELADA PARA NOVAS FUNCIONALIDADES.** A aplicação principal em `../index.html` é a experiência oficial responsiva. Esta pasta permanece temporariamente para compatibilidade e conserva fluxos legados de cotação rápida, consultor, mensagens e catálogo. Novas features, incluindo a Mesa de Vendas, devem ser implementadas somente na aplicação principal.

Esta pasta contém a versão do sistema **Olho de Gato (OG)** adaptada e otimizada para dispositivos móveis (smartphones Android, iOS e tablets).

---

## 🎯 Objetivos da Versão Mobile

1. **Agilidade no Campo e na Estrada:** Permitir que representantes comerciais, consultores e motoristas façam cotações de equalizadores em menos de 1 minuto diretamente pelo celular.
2. **Design Touch-First:**
   - Barra de navegação inferior (*Bottom Navigation Bar*) ao alcance do polegar.
   - Botões e seletores grandes (mínimo 48px de área de toque).
   - Suporte a *Safe Areas* (entalhe/notch de iPhones e barras gestuais do Android).
3. **Disparo Instantâneo para WhatsApp:** Envio da cotação formatada direto para o WhatsApp do cliente ou transportadora em 1 toque (`whatsapp://send`).
4. **Consultor de Suportes Portátil:** Árvore de decisão em formato de assistente passo a passo (*wizard*) para identificar o suporte exato no pátio da frota.
5. **PWA (Progressive Web App):** Suporte para "Adicionar à Tela de Início" como aplicativo nativo pelo navegador.

---

## 📂 Estrutura de Arquivos da Versão Mobile

- `index.html`: Interface principal mobile com abas touch:
  - ⚡ **Cotação Rápida**: Cálculo de caminhão, calibragem, tabela de preço e parcelamento.
  - 🚛 **Consultor de Suportes**: Passo a passo interativo para identificar suportes.
  - 💬 **WhatsApp & Vendas**: Disparo rápido de mensagens comerciais (curta, padrão e ROI).
  - 📦 **Catálogo Rápido**: Consulta de códigos e valores unitários das peças.
- `mobile.css`: Folha de estilo touch-optimized com paleta oficial OG (Dark + Amarelo #ffde17) e navegação inferior fixa.
- `mobile.js`: Lógica de estado e cálculo mobile, consumindo a base oficial `../data.js`.
- `manifest.json`: Configuração de PWA para instalação no smartphone.

---

## 🔗 Integração com a Versão Desktop (V4)

Esta versão mobile reaproveita os seguintes recursos da pasta principal:
- Base de dados e regras técnicas: `../data.js`
- Logotipo e ativos visuais: `../assets/`
- Link de retorno direto para a versão completa Desktop no topo da aplicação.

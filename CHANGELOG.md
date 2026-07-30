# Changelog — Refatoração Arquitetural

Todas as mudanças abaixo são **estruturais** (organização de arquivos e
comentários de documentação). Nenhuma mudança de comportamento, cálculo,
regra de negócio ou nome de função/variável foi feita.

## [Estrutural] Divisão do monólito em 35 arquivos JS + 5 arquivos CSS

**Antes:** `hub_conciliacao_marketplaces_V21.html` — 1 arquivo, 4.215
linhas, CSS e JS inline.

**Depois:** `index.html` (esqueleto + `<head>`/`<body>`) + `css/*.js`
(5 arquivos) + `js/**/*.js` (35 arquivos), organizados por marketplace
e por responsabilidade (services/components/core/managers).

### Movimentações notáveis (não óbvias a partir do nome/posição original)

- **`csvN`**: estava fisicamente posicionada entre a seção de Histórico
  e a seção Amazon no arquivo original (por isso parecia ligada ao
  Amazon), mas todas as chamadas reais são do fluxo Shopee
  (`downloadCSV` e `downloadBaixaDCC`). Movida para
  `services/shopee/exportService.js`.
- **Histórico JSON**: a seção original `HISTÓRICO JSON — Shopee &
  Mercado Livre` misturava infraestrutura genérica (`mergeById`,
  `downloadJSON`, variáveis `HIST_SHOPEE`/`HIST_ML`) com funções
  específicas de cada marketplace (`loadHistShopee`/`saveHistShopee` e
  `loadHistML`/`saveHistML`). A parte genérica foi para
  `managers/HistoryStorageManager.js` (Core); as partes específicas
  foram para `services/shopee/historyService.js` e
  `services/meli/historyService.js`.
- **`js/services/shopee/xlsxHelpers.js` e `js/services/shopee/formatters.js`**:
  apesar dos nomes genéricos (herdados do arquivo original), são de uso
  exclusivo do fluxo Shopee — documentado explicitamente no cabeçalho
  de cada arquivo para evitar reuso indevido em manutenções futuras.

### Ordem de carregamento

O `index.html` carrega `core/hub.js` e `managers/HistoryStorageManager.js`
primeiro (diferente da posição física deles no arquivo original, que
ficava no meio). Isso não altera comportamento porque nenhum desses
arquivos executa código no nível superior — apenas declara
funções/constantes, chamadas somente após o carregamento completo da
página. Ver ARCHITECTURE.md para a justificativa completa.

### Documentação adicionada

- Comentário JSDoc no topo de cada um dos 35 arquivos JS, descrevendo:
  o que o módulo faz, quais funções contém, e quais outros módulos ele
  depende. Comentários são adições puras (prepend) — não alteram
  nenhuma linha de código original.
- `ARCHITECTURE.md`, `ROADMAP.md`, `CHANGELOG.md` (este arquivo),
  `KNOWN_LIMITATIONS.md`, `TODO.md`.

## Não incluído nesta refatoração

- Nenhuma função foi renomeada.
- Nenhum algoritmo foi otimizado ou simplificado.
- Nenhuma regra de negócio foi alterada.
- Nenhum formato de exportação (CSV, ODS, Excel, JSON) foi alterado.
- Nenhum campo de importação foi renomeado.
- Não foi introduzido nenhum framework, bundler, ou ES modules.

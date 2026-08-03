# TODO — Melhorias futuras (opcionais, não implementadas)

Nada aqui foi implementado nesta refatoração. São sugestões para avaliar
**depois** que o projeto modular for validado em produção, cada uma com
seu próprio risco/benefício.

## Baixo risco

- [ ] Baixar a lib XLSX (`xlsx.full.min.js`) e hospedar localmente em
      `libs/`, para o sistema funcionar offline.
- [ ] Baixar as fontes do Google Fonts para `assets/fonts/` pelo mesmo
      motivo.
- [ ] Adicionar um `README.md` na raiz explicando como abrir o projeto
      (duplo clique em `index.html`, ou servir com qualquer servidor
      estático).

## Médio risco (requer testes antes de aplicar)

- [ ] Criar uma suíte de testes de regressão (ex.: com arquivos de
      exemplo reais de cada marketplace) comparando a saída do sistema
      modular byte-a-byte com a saída do sistema original, para os
      cálculos de negócio mais sensíveis: `calcTaxas` (Shopee),
      `parseAmzTSV`/`crossErpSettlement` (Amazon), `parseSCA`/`parseEC`
      (Mercado Livre), `snfProcess` (Shopee NF).
- [ ] Avaliar migração gradual para ES modules (`import`/`export`),
      o que exigiria: (1) servir o projeto via HTTP em vez de
      `file://`, e (2) tocar em toda referência cruzada entre módulos.
      Só deve ser feito com a suíte de testes do item anterior já no
      lugar.

## Solicitado pelo usuário (anotado, não implementado)

- [ ] **Persistência automática de dados.** Hoje o sistema (original e
      modular) não salva nada automaticamente — nem `localStorage`, nem
      `sessionStorage`, nem backend. O "Histórico" existente
      (`loadHistShopee`/`saveHistShopee`/`loadHistML`/`saveHistML`) é
      100% manual: salvar baixa um `.json`, carregar exige selecionar
      esse arquivo de novo na sessão seguinte. Se a aba fechar sem
      exportar, os dados processados na sessão se perdem. Usuário pediu
      para registrar isso como melhoria futura (ex.: auto-save via
      `localStorage` entre sessões) — **nada foi implementado ainda,
      aguardando decisão de quando priorizar.**

## Alto risco (mudança de comportamento potencial — avaliar com cuidado)

- [ ] Unificar os formatadores de data/moeda duplicados entre
      marketplaces (`services/shopee/formatters.js`, `amzN`/`amzFmtSigned`
      do Amazon, `snfFmt`/`snfParseCurrency` do Shopee NF) em um único
      utilitário compartilhado. Hoje eles têm comportamentos ligeiramente
      diferentes (ex.: tratamento de valores nulos/negativos) — unificar
      sem antes mapear essas diferenças pode alterar resultados exibidos.
- [ ] Unificar a leitura de XLSX (`wb2arr`/`findHdrRow`/`rows2objs` do
      Shopee vs. leituras próprias de Meli/Amazon/SNF) em um único
      helper genérico.
- [ ] Introduzir um estado centralizado (ex.: um `AppState.js` real)
      substituindo as variáveis globais soltas (`D`, `MELI_DATA`,
      `AMZ_DATA`, `SNF`). Melhoraria a manutenibilidade, mas é uma
      mudança arquitetural profunda, fora do espírito desta refatoração
      ("somente estrutural").
- [ ] Adicionar tratamento de erro mais robusto (hoje o sistema usa
      `alert()`/`try-catch` pontuais). Mudar isso pode alterar a
      experiência do usuário em casos de erro, então deve ser tratado
      como melhoria de produto, não de arquitetura.

## Backlog técnico — Amazon / validação / Fase 3

- [ ] Reduzir o JSON de validação do fluxo Amazon, removendo o array
      completo `rows` dos arquivos ignorados por hash e expondo apenas
      um resumo com arquivo original, arquivo ignorado, hash e
      quantidade de linhas.
- [ ] Melhorar a apresentação do `validate_amazon_index.html`, deixando
      os relatórios mais compactos, legíveis e fáceis de comparar entre
      execuções.
- [ ] Adicionar opção para exportar o relatório de validação em formato
      simples (por exemplo: JSON ou texto).
- [ ] Revisar a interface do harness de validação para facilitar testes
      futuros e reduzir o esforço de manutenção.
- [ ] Planejar uma integração incremental do novo pipeline Amazon ao
      fluxo principal, mantendo compatibilidade com dashboards,
      agregações e exportações atuais enquanto o parser legado continua
      disponível como fallback.

## Fora de escopo permanente (mencionado apenas para registro)

- Reescrever em um framework (React/Vue/etc.) — mudaria completamente a
  forma como a UI reage a eventos; não é uma refatoração estrutural, é
  uma reescrita.

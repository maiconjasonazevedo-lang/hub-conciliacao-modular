# Roadmap da Migração

Migração incremental do monólito `hub_conciliacao_marketplaces_V21.html`
para a arquitetura modular. Todas as etapas abaixo foram concluídas.

## Etapa 1 — Core da aplicação ✅

- Auditoria completa do arquivo original (25 seções mapeadas pelos
  próprios comentários do autor).
- Extração do que é genuinamente compartilhado entre marketplaces:
  `core/hub.js` (navegação) e `managers/HistoryStorageManager.js`
  (infraestrutura genérica de histórico).
- Achado: quase não há código "core" além disso — cada marketplace tem
  seus próprios parsers/formatadores/leitura de XLSX (ver ARCHITECTURE.md).

## Etapa 2 — Shopee ✅

- 12 arquivos criados (`services/shopee/*`, `components/shopee/*`).
- `csvN` identificada como uso exclusivo Shopee (apesar de estar
  fisicamente perto da seção Amazon no arquivo original) e movida para
  `exportService.js`.
- Verificação byte-a-byte dos 14 blocos de código + `node --check`
  individual e combinado com o Core.

## Etapa 3 — Mercado Livre ✅

- 7 arquivos criados (`services/meli/*`, `components/meli/*`).
- Seção original (sem subdivisão interna) dividida em
  storage/parsers/service/dashboard/export por limite de função.
- Confirmado zero dependência cruzada com o módulo Shopee.

## Etapa 4 — Amazon ✅

- 8 arquivos criados (`services/amazon/*`, `components/amazon/*`).
- Três seções originais (Módulo, ERP, ERP V2) divididas por
  responsabilidade.
- Confirmado isolamento total dos demais marketplaces.

## Etapa 5 — Shopee NF ✅

- 6 arquivos criados (`services/shopeeNF/*`, `components/shopeeNF/*`).
- Seção original já vinha com boa subdivisão interna pelo autor;
  mapeamento quase 1:1.

## Etapa 6 — Revisão final ✅

- CSS dividido em 5 arquivos (`variables`, `reset`, `layout`,
  `components`, `tables`), verificado com o mesmo rigor do JS.
- `index.html` final montado, referenciando os 5 CSS e os 35 JS na
  ordem de carregamento correta.
- Auditoria cruzada: todo `onclick=`/`onchange=` do HTML confirmado
  contra função existente nos módulos — nenhuma referência quebrada.
- Verificação de cobertura total: 100% das linhas de código não-vazias
  do `script.js` original presentes exatamente uma vez na soma dos 35
  módulos.
- Teste real de carregamento via jsdom (navegador headless): zero erros
  de execução, 52 funções críticas presentes em `window`.
- Teste real de interação: navegação completa entre os 4 marketplaces
  + validação numérica de `round2`, `csvN` e `amzN` contra o
  comportamento esperado.

## Próximos passos (fora do escopo desta refatoração)

Ver `TODO.md` para melhorias *opcionais* que podem ser avaliadas depois
que este projeto modular for validado em produção pelo usuário. Nenhuma
delas foi implementada — a prioridade desta migração foi 100%
preservação de comportamento.

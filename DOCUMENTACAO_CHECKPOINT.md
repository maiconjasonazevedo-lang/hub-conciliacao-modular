# Checkpoint da versão atual

## Visão geral
Este checkpoint registra o estado atual do projeto após a estabilização do fluxo principal e as correções recentes no módulo Shopee, além da publicação em GitHub Pages.

## Estado real do repositório
- Branch: main
- Commit da correção incluída: 3d252f0
- Versão exibida no front: 3.1.4
- Build atual: b3d252f0
- Deploy público: GitHub Pages habilitado
- Documentação atualizada: DOCUMENTACAO_CHECKPOINT.md, README.md e CHANGELOG.md

## Atualizações recentes concluídas
- Ajuste no cálculo e reconciliamento de taxas DCC da Shopee.
- Correção da taxa por item considerando os dois cabeçalhos de taxa de transação.
- Correção de quantidade de itens e filtro do fluxo de saque Shopee.
- Remoção de apostrofos em exportações do DCC da Shopee.
- Configuração do workflow de publicação em GitHub Pages.
- Sincronização do metadado da versão exibida no app com o deploy atual.

## Arquitetura atual
- Front principal em index.html.
- Organização por módulos em js/core, js/components, js/services, js/managers e assets/css.
- Separação por marketplace e responsabilidade: storage, parser, service, dashboard, exportação e navegação.
- Versionamento centralizado em js/core/appVersion.js.
- Deploy estático via GitHub Pages a partir da branch main.

## Módulos principais
- js/core/hub.js: navegação principal e renderização da versão no hub.
- js/core/appVersion.js: versão, build e data exibidos no front.
- js/services/shopee/parsers.js: parsing dos relatórios e dados de pedido/quantidade.
- js/services/shopee/processFiles.js: consolidação dos dados de renda, pedidos e itens.
- js/services/shopee/exportService.js: exportação e formatos da ferramenta Shopee.
- js/services/amazon/amazonStorage.js: upload, hash e estado do conteúdo.
- js/services/amazon/amazonService.js: fluxo principal do Amazon.
- js/services/amazon/amazonSettlementParsers.js: parser do Settlement.
- js/services/amazon/amazonTransactionParsers.js: parser do Transaction Report.
- js/services/meli/meliExportService.js: exportação do Mercado Livre.
- js/components/shopee/: telas e dashboards do fluxo Shopee.
- js/components/amazon/: dashboards e telas de resultado do Amazon.

## Fluxo principal do app
1. Acessar a aplicação via GitHub Pages ou servidor local.
2. Logar no hub principal.
3. Selecionar o marketplace.
4. Importar arquivos de relatório ou dados de exportação.
5. Processar, reconciliar e exportar resultados com base em regras de negócio validadas.

## O que já foi consolidado
- Modularização do app sem quebrar o fluxo principal.
- Correções específicas no fluxo Shopee para saque, DCC e item quantity.
- Deploy automatizado para GitHub Pages.
- Exibição da versão/build/data do app sincronizada com o build atual.
- Separação dos arquivos locais de teste/exportação do controle de versionamento.

## O que precisa ser preservado
- Nenhum arquivo de dados real (.xlsx, .csv, exports) deve ser enviado ao Git sem necessidade.
- O app continua sendo dependente de servidor HTTP ou GitHub Pages; não é recomendável abrir o projeto direto por file://.
- Qualquer ajuste financeiro ou de itens deve ser validado com o relatório real antes de fechar uma release.
- A version metadata do front deve acompanhar o build oficial publicado.

## Próximo passo sugerido
- Validar o comportamento do saque da Shopee em produção/Pages com um cenário real e registrar o resultado em checklist de QA.
- Revisar eventualmente a documentação técnica do fluxo Amazon e do fluxo Shopee em paralelo para manter a referência atualizada.

## Como validar manualmente
1. Abrir a URL pública do GitHub Pages.
2. Fazer login no hub.
3. Carregar os relatórios relevantes do marketplace.
4. Conferir a version metadata apresentada no hub.
5. Validar o cálculo de taxas, quantidades e valores do saque Shopee.
6. Registrar divergências e ajustar o módulo correspondente.

## Como retomar o desenvolvimento
1. Clonar o repositório.
2. Abrir a pasta no VS Code.
3. Rodar um servidor local ou usar o deploy do GitHub Pages.
4. Ler este checkpoint junto com README.md, ARCHITECTURE.md e ROADMAP.md.
5. Priorizar ajustes sobre js/services/shopee/ e js/core/appVersion.js quando a mudança impacta o front e o deploy.

# Checkpoint da versão atual

## Visão geral
Este checkpoint registra o estado do projeto após a consolidação da refatoração modular e da primeira etapa da integração do pipeline Amazon no fluxo principal. O foco atual é continuar a evolução sem quebrar o comportamento já validado.

## Estado real do repositório
- Branch: main
- Último commit: 163a70c
- Versão exibida no front: 3.1.0
- Arquivos de documentação recém-atualizados: CONTEXTO_PROJETO.md, DOCUMENTACAO_CHECKPOINT.md, ROADMAP.md e TODO.md

## Arquitetura atual
- Front principal em index.html.
- Organização por módulos em js/core, js/components, js/services e js/managers.
- Separação por marketplace e por responsabilidade (storage, parser, service, dashboard, exportação).
- Versionamento centralizado em js/core/appVersion.js.

## Módulos principais
- js/core/hub.js: navegação principal do hub.
- js/services/amazon/amazonStorage.js: estado, upload e hash de conteúdo.
- js/services/amazon/amazonService.js: fluxo principal de processamento do Amazon.
- js/services/amazon/amazonParsers.js: parser legado do Settlement.
- js/services/amazon/amazonSettlementParsers.js: parser novo de Settlement.
- js/services/amazon/amazonTransactionParsers.js: parser novo de Transaction Report.
- js/services/amazon/amazonFileImportService.js: detecção de tipo e validação inicial.
- js/services/amazon/amazonIndexService.js: indexação, deduplicação por hash e validação.
- js/components/amazon/: dashboards e telas de resultado do Amazon.

## Fluxo do Amazon
1. Upload de arquivos no front.
2. Detecção automática do tipo do arquivo.
3. Processamento preferencial pelo pipeline novo, com fallback para o parser legado.
4. Deduplicação por hash de conteúdo para ignorar arquivos repetidos com nomes diferentes.
5. Geração de dados para dashboard, agregações e fluxo de ERP.

## O que já foi consolidado
- Integração incremental do novo pipeline Amazon no fluxo principal.
- Deduplicação por hash aplicada no fluxo real do app para Settlement.
- Validação isolada do indexamento e da relação entre Transaction Report, Settlement e orders.
- Exibição discreta de versão/build/data no front.

## O que precisa ser preservado
- O parser legado não deve ser removido antes da validação completa do novo fluxo.
- A deduplicação por hash deve permanecer antes da agregação e do indexamento.
- O fluxo deve continuar a funcionar via servidor local, não como simples abertura local do HTML.
- A validation UI e os relatórios de validação devem ser tratados como ferramentas de apoio, não como substitutos do teste manual no navegador.

## Próximo passo
- Iniciar a Fase 3.2 com a integração do Transaction Report no fluxo principal, mantendo compatibilidade com Settlement + ERP já validada.

## Como validar manualmente
1. Rodar o projeto com um servidor local.
2. Carregar arquivos Amazon reais no fluxo principal.
3. Confirmar que o processamento não quebra o dashboard e a lógica ERP.
4. Comparar comportamento entre o fluxo legado e o novo pipeline quando houver arquivo compatível.
5. Registrar qualquer divergência antes de avançar para a próxima etapa.

## Como retomar o desenvolvimento em outra conta/dev
1. Clonar o repositório.
2. Abrir a pasta no VS Code.
3. Rodar um servidor local e abrir a aplicação em navegador.
4. Ler este checkpoint junto com CONTEXTO_PROJETO.md e ROADMAP.md.
5. Priorizar os módulos Amazon em js/services/amazon/ e o ponto de entrada index.html.

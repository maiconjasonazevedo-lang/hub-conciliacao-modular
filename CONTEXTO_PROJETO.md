# Contexto do projeto — Hub Conciliação Modular

## Objetivo do projeto
Este projeto é uma aplicação web estática em HTML/CSS/JS para conciliação de marketplaces, com foco inicial em Amazon, Mercado Livre, Shopee e Shopee NF. A prioridade atual é preservar o fluxo existente enquanto se introduz uma migração incremental para um pipeline Amazon mais estruturado, baseado em parsing, indexação e deduplicação.

## Status atual do repositório
- Branch atual: main
- Remote: origin/main
- Último commit: 163a70c — feat: adiciona identificacao de versao no front
- Versão exibida no front: 3.1.0
- Data registrada: 2026-08-03

A base do projeto já passou por uma refatoração estrutural modular. O que ainda está em evolução é a integração do novo pipeline Amazon ao fluxo principal, especialmente o tratamento de Transaction Report.

## Como rodar o projeto
- Não confiar em abrir o arquivo diretamente por duplo clique em index.html em todos os ambientes. O projeto depende de scripts e estilos externos e o modo mais confiável é usar um servidor local.
- Recomendação: Live Server no VS Code ou qualquer servidor estático simples, por exemplo:
  - python -m http.server 8000
- Acesso esperado: http://localhost:8000/index.html

## Arquitetura geral
A aplicação segue uma estrutura modular simples, sem bundler:
- index.html: ponto de entrada principal.
- css/: estilos por responsabilidade.
- js/core/: navegação e configuração compartilhada.
- js/components/: telas e dashboards por marketplace.
- js/services/: parsers, serviços e lógica de negócio.
- js/managers/: armazenamento e histórico.

## Estrutura principal do projeto
- index.html
- css/
  - components.css
  - layout.css
  - login.css
  - reset.css
  - tables.css
  - user-management.css
  - variables.css
- js/
  - core/
    - appVersion.js
    - hub.js
  - components/
    - amazon/
    - auth/
    - meli/
    - shopee/
    - shopeeNF/
  - managers/
    - HistoryStorageManager.js
    - UserStorageManager.js
  - services/
    - amazon/
    - meli/
    - shopee/
    - shopeeNF/

## Fluxo atual do Amazon
O fluxo Amazon foi adaptado para manter compatibilidade com o comportamento anterior, enquanto incorpora um pipeline novo em etapas.

### Passo a passo atual
1. O usuário faz upload de arquivos pelo front.
2. O sistema tenta detectar o tipo do arquivo.
3. O fluxo usa preferencialmente o pipeline novo, com fallback para o parser legado.
4. Arquivos Settlement duplicados por conteúdo são ignorados com base em hash.
5. Os dados processados alimentam o dashboard e os fluxos ligados a ERP.

## Arquivos críticos para continuidade
- js/services/amazon/amazonService.js: orquestração principal do fluxo Amazon.
- js/services/amazon/amazonStorage.js: leitura de arquivos, estado local e cálculo de hash.
- js/services/amazon/amazonParsers.js: parser legado do Settlement.
- js/services/amazon/amazonSettlementParsers.js: parser novo de Settlement.
- js/services/amazon/amazonTransactionParsers.js: parser novo de Transaction Report.
- js/services/amazon/amazonFileImportService.js: detecção de tipo e validação inicial do arquivo.
- js/services/amazon/amazonIndexService.js: indexação, deduplicação e geração de relatório de validação.
- index.html: ponto de entrada da UI e carregamento dos módulos.
- js/core/appVersion.js: configuração central de versão.

## Informações críticas para outro desenvolvedor
- O parser legado deve ser preservado como fallback até a validação completa do novo fluxo.
- A integração deve ser incremental; evitar substituições bruscas no fluxo principal.
- A deduplicação por hash acontece antes da agregação e do indexamento.
- O projeto depende de variáveis globais e de um modelo de scripts clássicos; mudanças de estrutura devem ser feitas com cuidado.
- A validação visual e funcional é tão importante quanto a revisão de código, porque a aplicação é fortemente dependente do comportamento do navegador.

## Funcionalidades já consolidadas
- Pipeline novo do Amazon iniciado no fluxo principal.
- Detecção do tipo de arquivo no front.
- Deduplicação por hash para Settlement duplicado por conteúdo.
- Índice isolado para validação de relações entre Transaction Report, Settlement e orders.
- Relatório de validação de índices e deduplicação.
- Identificação de versão/build/data exibida no front.

## Próximo passo recomendado
A prioridade imediata é a Fase 3.2:
- integrar o Transaction Report ao fluxo principal;
- manter compatibilidade com Settlement + ERP já validada;
- evitar regressões no fluxo atual.

## Checklist de continuidade
1. Revisar os módulos Amazon em js/services/amazon/.
2. Confirmar se o fluxo principal continua validando arquivos de Settlement e ERP.
3. Integrar o Transaction Report sem remover o fallback legado.
4. Validar o resultado em navegador com arquivos reais.
5. Atualizar a documentação sempre que uma etapa nova for concluída.

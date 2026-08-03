# Roadmap da Migração

A refatoração estrutural do projeto já foi concluída. O foco atual mudou de "migrar o monólito para módulos" para "evoluir o pipeline Amazon sem quebrar o comportamento existente".

## Status atual
- Refatoração modular: concluída.
- Integração incremental do pipeline Amazon: em andamento.
- Fase 3.1: concluída com integração parcial do fluxo novo de Settlement e deduplicação por hash.
- Fase 3.2: próxima etapa, com integração do Transaction Report ao fluxo principal.

## Etapa 1 — Core da aplicação ✅
- Auditoria completa do arquivo original.
- Extração do que é genuinamente compartilhado entre marketplaces.
- Resultado: estrutura modular estabilizada com separação por responsabilidade.

## Etapa 2 — Shopee ✅
- Módulo Shopee extraído para arquivos próprios.

## Etapa 3 — Mercado Livre ✅
- Módulo Mercado Livre extraído para arquivos próprios.

## Etapa 4 — Amazon ✅
- Módulo Amazon extraído para arquivos próprios.
- O fluxo atual passou a usar uma camada de importação, parsing e indexação mais estruturada.

## Etapa 5 — Shopee NF ✅
- Módulo Shopee NF extraído para arquivos próprios.

## Etapa 6 — Revisão final ✅
- CSS e scripts reorganizados em módulos.
- Index principal montado com ordem correta de carregamento.
- Validação inicial do fluxo realizada.

## Fase 3 — Integração incremental do pipeline Amazon

### Objetivo
Integrar o novo pipeline Amazon ao fluxo principal da aplicação sem quebrar o comportamento existente.

### O que já está implementado
- Detecção do tipo de arquivo no front.
- Uso preferencial do pipeline novo com fallback para o parser legado.
- Deduplicação por hash para Settlement.
- Validação isolada do serviço de índices.
- Identificação de versão/build/data no front.

### Próximo bloco de trabalho
- Integrar o Transaction Report ao fluxo principal.
- Preservar o parser legado como fallback até a validação completa.
- Garantir compatibilidade com Settlement, ERP e dashboards previstos.
- Validar o fluxo com arquivos reais em navegador.

## Pontos de atenção para a continuidade
- Não remover o parser legado de forma prematura.
- Validar cada incremento com arquivos reais antes de avançar.
- Manter a documentação atualizada ao concluir cada etapa.

## Próximos passos fora do escopo de refatoração
As melhorias opcionais continuam em TODO.md. Elas não devem ser priorizadas antes da estabilização do fluxo Amazon atual.

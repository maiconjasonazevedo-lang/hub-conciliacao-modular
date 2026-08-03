# TODO — Melhorias futuras e próximos passos

Este arquivo agora deve servir tanto como backlog futuro quanto como guia para a continuidade imediata. As tarefas abaixo não alteram a lógica de negócio, mas algumas têm impacto direto no fluxo atual e devem ser tratadas com cuidado.

## Prioridade imediata (não opcional para a continuidade)

- [ ] Integrar o Transaction Report ao fluxo principal do Amazon sem quebrar o fluxo atual de Settlement e ERP.
- [ ] Validar o fluxo com arquivos reais em navegador, comparando os resultados do pipeline novo com o comportamento já conhecido.
- [ ] Preservar o parser legado como fallback até a integração do Transaction Report estar estabilizada.
- [ ] Revisar se a saída do indexador e do relatório de validação está alinhada com o que o front precisa consumir.
- [ ] Atualizar a documentação sempre que uma nova etapa do fluxo Amazon for concluída.

## Baixo risco

- [ ] Baixar a lib XLSX e hospedar localmente em libs/ para reduzir dependência de CDN.
- [ ] Baixar as fontes do Google Fonts para assets/fonts/ pelo mesmo motivo.
- [ ] Melhorar o README com instruções mais claras de execução local.

## Médio risco (requer testes antes de aplicar)

- [ ] Criar uma suíte de testes de regressão com arquivos de exemplo reais para comparar o comportamento do sistema modular com o original em pontos sensíveis do negócio.
- [ ] Avaliar migração gradual para ES modules, o que exigiria revisar as referências globais e o modo de servir os arquivos.

## Solicitado pelo usuário (anotado, não implementado)

- [ ] Persistência automática de dados. Hoje o sistema não salva automaticamente nem em localStorage nem em backend. O histórico existente é manual e depende de exportação/importação.

## Alto risco (mudança de comportamento potencial — avaliar com cuidado)

- [ ] Unificar formatadores de data/moeda duplicados entre marketplaces.
- [ ] Unificar a leitura de XLSX em um helper compartilhado.
- [ ] Introduzir um estado centralizado substituindo variáveis globais soltas.
- [ ] Melhorar o tratamento de erro e feedback visual em caso de falha.

## Backlog técnico — Amazon / validação / Fase 3

- [ ] Reduzir o JSON de validação do fluxo Amazon, removendo o array completo de linhas dos arquivos ignorados por hash.
- [ ] Melhorar a apresentação do validate_amazon_index.html.
- [ ] Adicionar opção para exportar o relatório de validação em formato simples.
- [ ] Revisar a interface do harness de validação para facilitar testes futuros.

## Fora de escopo permanente

- Reescrever em um framework como React ou Vue. Isso mudaria profundamente a arquitetura e não é uma melhoria incremental.

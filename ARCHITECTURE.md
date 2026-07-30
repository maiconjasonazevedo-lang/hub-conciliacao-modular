# Arquitetura — Hub de Conciliação Marketplaces

## Visão geral

Este projeto era, originalmente, um único arquivo HTML de 4.215 linhas
(`hub_conciliacao_marketplaces_V21.html`) com todo o CSS num bloco `<style>`
e todo o JavaScript (3.390 linhas, ~90 funções) num único bloco `<script>`.

Esta refatoração **não reescreveu nenhuma lógica**. Todo o código foi
extraído linha a linha do arquivo original e redistribuído em módulos,
sem alterar nomes, algoritmos, ordem de execução ou comportamento. Isso
foi verificado programaticamente (ver seção "Como foi verificado").

## Por que a árvore de pastas é diferente da proposta inicial

A proposta inicial (espelhando o projeto do PDF Editor) previa módulos
como `core/AppState.js`, `core/EventBus.js`, `controllers/AppController.js`
etc. Depois de auditar o código real, decidi **não criar esses arquivos**:
o sistema atual não usa um barramento de eventos, não tem um AppState
centralizado, nem controllers — é um conjunto de funções globais
disparadas diretamente por atributos `onclick`/`onchange` no HTML. Criar
esses arquivos vazios seria introduzir código morto ou (pior) uma nova
camada de indireção que mudaria o fluxo de execução. Por isso a árvore
final reflete a arquitetura real do sistema (procedural, com funções
globais por marketplace), não um template genérico.

## Estrutura final

```
index.html
css/
  variables.css      – :root{ --bg, --orange, --fh, ... }
  reset.css           – *{...}, body{...}
  layout.css          – telas de upload, cards, app shell, saques
  components.css      – filtros, drawer, badges SNF, hub/home
  tables.css          – tabela de resultados + paginação

js/
  core/
    hub.js                       – navegação principal (Hub)
  managers/
    HistoryStorageManager.js     – infraestrutura genérica de histórico
                                    (mergeById, downloadJSON, estado)

  services/shopee/
    navigation.js                – home Shopee (Conciliação vs NF)
    entryScreens.js               – telas de entrada Shopee
    fileStorage.js                – upload/armazenamento de arquivos
    xlsxHelpers.js                – leitura de planilha (uso exclusivo Shopee)
    parsers.js                    – parsers Income/SvcFee/Trans/Anymarket/Orders
    processFiles.js               – orquestração do processamento
    formatters.js                 – formatação de data/valor (uso exclusivo Shopee)
    exportService.js              – exportação CSV (Saques ODS) + csvN
    baixaDccService.js            – Baixa DCC (upload + exportar 988)
    historyService.js             – histórico específico Shopee
  components/shopee/
    Dashboard.js                  – dashboard, transações, biblioteca, saques, NFs
    Drawer.js                     – painel lateral de detalhes

  services/meli/
    entryScreens.js                – telas de entrada Mercado Livre
    meliStorage.js                 – estado/upload/leitura de arquivo ML
    meliParsers.js                 – parsers SCA e EC
    meliService.js                 – orquestração (processMeli)
    meliExportService.js           – exportação ODS
    historyService.js              – histórico específico Mercado Livre
  components/meli/
    MeliDashboard.js               – filtro + tabela de resultados ML

  services/amazon/
    amazonStorage.js               – estado/upload/formatadores Amazon
    amazonParsers.js                – parser do settlement (TSV)
    amazonService.js                – orquestração (processAmazon)
    amazonErpService.js             – parser ERP (JVCR4010) + cruzamento
    amazonErpV2ExportService.js     – exportação Excel ERP V2
  components/amazon/
    AmazonDashboard.js              – renderização do settlement
    AmazonErpDashboard.js           – renderização ERP x Settlement
    AmazonErpV2Dashboard.js         – renderização ERP V2

  services/shopeeNF/
    navigation.js                   – navegação da Conciliação NF
    shopeeNFStorage.js              – estado + formatação (snfFmt, etc.)
    shopeeNFOrdersReader.js         – leitura do Orders XLSX
    shopeeNFService.js              – orquestração (snfProcess)
    shopeeNFExportService.js        – exportação Excel do comparativo
  components/shopeeNF/
    ShopeeNFDashboard.js            – renderização de resultado e tabela
```

**35 arquivos JS + 5 arquivos CSS + 1 `index.html`.**

## Decisão técnica: scripts clássicos, não ES modules

Optei por `<script src="...">` carregados em sequência (sem `type="module"`,
sem `import`/`export`). Dois motivos:

1. **Compatibilidade**: ES modules exigem servidor HTTP; não funcionam
   abrindo o arquivo com duplo-clique (`file://`), que é como este sistema
   é usado hoje.
2. **Segurança comportamental**: converter ~90 funções para `export`/`import`
   tocaria em toda referência cruzada do código — risco real de alterar
   comportamento, contra a regra explícita de não reescrever/otimizar.

Com scripts clássicos, todas as funções e variáveis (`D`, `MELI_DATA`,
`AMZ_DATA`, `SNF`, etc.) continuam no mesmo escopo global `window`,
exatamente como no arquivo original — só a localização física mudou.

## Descoberta importante da auditoria: não há "core" de parsing/formatação

Um achado central da Etapa 1: **cada marketplace tem seus próprios
parsers, formatadores e rotina de leitura de XLSX, totalmente
independentes uns dos outros.** Rastreei função por função (não apenas
onde é definida, mas onde é *chamada*) e confirmei:

- `f/fBR/fBRsigned/fn2/round2/parseDate/fmtDateBR` → usadas **somente** pelo Shopee.
- `amzN/amzFmtSigned` → usadas **somente** pelo Amazon.
- `snfFmt/snfParseCurrency` → usadas **somente** pela Conciliação NF Shopee.
- `wb2arr/findHdrRow/rows2objs/dedupeHeaders` → usadas **somente** pelos parsers Shopee.

Isso significa que o único código genuinamente compartilhado entre
marketplaces é a navegação do Hub e a infraestrutura genérica de
histórico (`mergeById`, `downloadJSON`). Por regra do projeto ("não
otimizar, não simplificar"), **não unifiquei** essas implementações
parecidas-mas-diferentes — cada uma permanece isolada no seu módulo,
exatamente como no original.

## Ordem de carregamento dos scripts

A ordem no `index.html` prioriza dependências (Core primeiro), diferindo
ligeiramente da ordem física do arquivo original (que tinha, por exemplo,
o histórico genérico no meio do arquivo, não no início). Isso é seguro
porque **nenhum código no nível superior dos arquivos é executado
imediatamente** — são apenas declarações de `function`/`const`/`let`,
todas chamadas somente depois que a página termina de carregar (via
`onclick`/`onchange`). Não há `DOMContentLoaded`, `window.onload` nem
código auto-executável no sistema original. Isso foi confirmado por
busca no código-fonte e por teste real de carregamento (ver abaixo).

## Como foi verificado

1. **Reconstrução por linha**: cada uma das ~90 funções/blocos foi
   extraída pelos limites exatos de função (ou pelos comentários de
   seção do próprio autor original) e comparada programaticamente,
   caractere a caractere, contra o `script.js` de origem.
2. **Verificação de cobertura total**: ao final, comparei o *multiset*
   de todas as linhas não-vazias de código entre o arquivo original e a
   soma dos 35 módulos — **100% de correspondência**, sem nenhuma linha
   perdida, duplicada ou alterada.
3. **`node --check`** em cada um dos 35 arquivos individualmente, e no
   conjunto inteiro concatenado — sem erros de sintaxe, sem colisão de
   identificadores.
4. **Teste real de carregamento (jsdom)**: o `index.html` final foi
   carregado por um navegador headless real (jsdom), executando os 35
   `<script src>` na ordem definida. Resultado: zero erros de execução,
   e as 52 funções críticas de todos os marketplaces confirmadas
   presentes em `window`.
5. **Teste de interação real**: simulei cliques reais — navegar
   Hub → Shopee → Hub → Mercado Livre → Hub → Amazon → Hub → Shopee →
   Conciliação NF — e chamei funções de cálculo (`round2`, `csvN`,
   `amzN`) para confirmar que produzem exatamente os mesmos resultados
   numéricos do código original.

Nenhuma regra de negócio, cálculo, nome de função/variável, formato de
exportação ou fluxo de tela foi alterado nesta refatoração.

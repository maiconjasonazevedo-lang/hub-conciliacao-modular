# Análise técnica da conciliação Amazon

## 1. Visão geral

A implementação atual da conciliação Amazon é uma pipeline em camadas, com entrada de arquivos, parsing, normalização, agregação e renderização em abas do dashboard. O fluxo é executado no navegador, com estado global mantido em variáveis globais de janela/escopo global.

A lógica principal cobre três cenários:

1. Leitura bruta do Settlement Report.
2. Cruzamento legado de pedidos do ERP com eventos do Settlement, preservado em arquivos mas sem uso ativo no frontend atual.
3. Conciliação ERP V2, que é a implementação funcional e ativa no frontend atual, baseada em um mapa agregador de pedidos por Order ID.

---

## 2. Entradas do processo

### 2.1 Upload do Settlement

O ponto de entrada está na interface principal em [index.html](index.html). O formulário aceita:

- um ou mais arquivos de Settlement em formato TXT/TSV;
- um arquivo ERP no formato JVCR4010 (XML/SpreadsheetML/XLSX).

Os handlers ligados à interface são:

- loadAmzFiles(event): lê os arquivos do Settlement.
- loadAmzErp(event): lê o arquivo ERP.
- processAmazon(): inicia o processamento após o upload.

### 2.2 Fontes de dados

A implementação atual aceita:

- Settlement Amazon: arquivo exportado pelo Seller Central.
- ERP JVCR4010: lista mestre de pedidos do período.

---

## 3. Fluxo completo da conciliação

### 3.1 Etapa A — leitura e armazenamento dos arquivos

Arquivo responsável: [js/services/amazon/amazonStorage.js](js/services/amazon/amazonStorage.js)

O módulo mantém o estado global:

- AMZ_DATA: estrutura com linhas do settlement e resumos por settlement.
- amzRawFiles: lista de arquivos carregados.
- amzPage / AMZ_PS: controle de paginação da tabela Settlement.

A função loadAmzFiles() lê cada arquivo com FileReader, armazena o conteúdo em amzRawFiles e habilita o botão de processamento.

### 3.2 Etapa B — parsing do Settlement

Arquivo responsável: [js/services/amazon/amazonParsers.js](js/services/amazon/amazonParsers.js)

A função parseAmzTSV(text) faz:

1. separa o texto em linhas;
2. identifica o header do TSV;
3. cria um índice de colunas por nome;
4. lê a linha de resumo do settlement (summary);
5. itera nas linhas de transações e cria objetos de evento.

Cada linha de transação vira um objeto com o formato aproximado:

```js
{
  txType,
  orderId,
  amtType,
  amtDesc,
  amount,
  sku,
  qty,
  date,
  mktName,
  settlementId
}
```

A linha de resumo do arquivo vira um objeto com:

```js
{
  id,
  startDate,
  endDate,
  depositDate,
  totalAmount
}
```

### 3.3 Etapa C — orquestração principal

Arquivo responsável: [js/services/amazon/amazonService.js](js/services/amazon/amazonService.js)

A função processAmazon() coordena o fluxo:

1. lê todos os arquivos do Settlement;
2. chama parseAmzTSV(text) para cada arquivo;
3. junta todos os rows em um único array;
4. monta o resumo de settlements;
5. monta o mapa orderId -> eventos;
6. cruza com o ERP, se houver pedidos carregados;
7. chama a renderização da interface.

### 3.4 Etapa D — parsing do ERP

Arquivo responsável: [js/services/amazon/amazonErpService.js](js/services/amazon/amazonErpService.js)

A função parseErpJVCR4010(xmlText) lê o XML do relatório JVCR4010 e extrai pedidos em formato de lista mestre:

```js
{
  orderId,
  pedidoVenda,
  notaFiscal,
  dtPedidoMarketplace,
  dtEmissao,
  vlVendaERP,
  vlComissaoERP,
  secao
}
```

Também tenta inferir o período do ERP com base no cabeçalho, e guarda os metadados em:

- AMZ_ERP_ORDERS._periodStart
- AMZ_ERP_ORDERS._periodEnd

### 3.5 Etapa E — cruzamento ERP × Settlement

Arquivo responsável: [js/services/amazon/amazonErpService.js](js/services/amazon/amazonErpService.js)

O fluxo usa três funções principais:

- buildSettlementMap(rows): monta um mapa de eventos por orderId.
- aggregateEvents(events): agrega os eventos de um mesmo pedido em categorias financeiras.
- crossErpSettlement(erpOrders, settlementMap): cria uma lista de pedidos ERP enriquecidos por valores vindos do Settlement.

O status de cada pedido é calculado por calcStatus():

- found: encontrou eventos e tem commission/principal válidos;
- partial: encontrou eventos, mas faltou commission ou principal;
- missing: não há eventos no settlement.

### 3.6 Etapa F — renderização das abas

Arquivos responsáveis:

- [js/components/amazon/AmazonDashboard.js](js/components/amazon/AmazonDashboard.js)
- [js/components/amazon/AmazonErpDashboard.js](js/components/amazon/AmazonErpDashboard.js)
- [js/components/amazon/AmazonErpV2Dashboard.js](js/components/amazon/AmazonErpV2Dashboard.js)

A interface atual monta duas visões ativas:

- Settlement: exibe as linhas brutas e os cards financeiros por categoria.
- Conciliação ERP V2: é a visão funcional e principal no frontend atual, usando um mapa já consolidado por Order ID com estrutura mais rica para análise por pedido.

A antiga aba de Conciliação ERP foi removida do frontend; os arquivos relacionados ainda existem por segurança e compatibilidade, mas não são mais renderizados na interface.

---

## 4. Onde os arquivos Settlement são importados

O import real acontece em dois pontos:

1. Interface de upload em [index.html](index.html), no campo de arquivo Settlement.
2. Processamento em [js/services/amazon/amazonStorage.js](js/services/amazon/amazonStorage.js), com loadAmzFiles(event), que lê o conteúdo em memória.
3. Parse e transformação em [js/services/amazon/amazonParsers.js](js/services/amazon/amazonParsers.js).
4. Orquestração em [js/services/amazon/amazonService.js](js/services/amazon/amazonService.js), que junta todos os arquivos e inicia a conciliação.

Em termos de fluxo, o arquivo chega em:

- FileReader -> amzRawFiles -> parseAmzTSV -> AMZ_DATA.rows + AMZ_DATA.settlements -> buildSettlementMap -> cruzamento.

---

## 5. Como os dados são normalizados

A normalização atual é feita em três níveis:

### 5.1 Normalização numérica

Em [js/services/amazon/amazonStorage.js](js/services/amazon/amazonStorage.js), a função amzN() converte strings em números. Ela cobre:

- valores com ponto e vírgula;
- valores com milhares separadas por ponto;
- valores com decimal em vírgula;
- valores vazios e nulos.

Isso é essencial porque o Settlement vem como texto TSV e precisa virar valor numérico.

### 5.2 Normalização estrutural

Em [js/services/amazon/amazonParsers.js](js/services/amazon/amazonParsers.js), os campos são extraídos por nome de coluna do header do TSV, com trim() e mapeamento por chave.

A estrutura base é uniformizada para:

- txType
- orderId
- amtType
- amtDesc
- amount
- sku
- qty
- date
- mktName
- settlementId

### 5.3 Normalização semântica para dashboard

Em [js/components/amazon/AmazonDashboard.js](js/components/amazon/AmazonDashboard.js), a classificação financeira para os cards usa exclusivamente amtDesc para categorizar linhas. Esse é um ponto importante da implementação atual:

- txType e amtType não decidem a categoria para os cards;
- a categoria é derivada de amtDesc exato;
- os cards e o AMZ_ORDER_MAP são construídos a partir dessas categorias.

Isso faz o sistema ser bastante sensível ao texto exato das descrições, mas também torna a normalização mais previsível.

---

## 6. Como os cards do dashboard são calculados

### 6.1 Aba Settlement

Os cards são gerados em [js/components/amazon/AmazonDashboard.js](js/components/amazon/AmazonDashboard.js). A lógica usa agrupamentos por amtDesc para montar categorias como:

- Principal
- Shipping
- Commission
- ShippingHB
- Flex Fee
- Easy Ship
- Refund Principal
- Refund Commission
- Advertising
- Reembolsos Amazon
- SAFE-T
- Não classificados

Os valores são somados por categoria com a função sum(cat.xxx).

O card mais importante do fim do painel é:

- Total Repasse = soma do campo totalAmount dos settlements carregados.

### 6.2 Aba ERP

Os cards em [js/components/amazon/AmazonErpDashboard.js](js/components/amazon/AmazonErpDashboard.js) usam:

- total de pedidos ERP;
- contagem de status found/partial/missing;
- valores ERP (venda e comissão);
- valores agregados do Settlement por categoria principal.

### 6.3 Aba ERP V2

Os cards em [js/components/amazon/AmazonErpV2Dashboard.js](js/components/amazon/AmazonErpV2Dashboard.js) usam o mapa AMZ_ORDER_MAP, que já consolidou os eventos por Order ID. A métrica financeira principal é baseada em campos Net/Gross/Refund, por categoria:

- principalNet
- shippingNet
- commissionNet
- shippingHBNet
- flexFeeNet

A ideia é evitar dupla contagem entre venda e refund e manter uma visão líquida do pedido.

---

## 7. Como a tabela final é montada

### 7.1 Tabela da aba Settlement

A tabela é montada por buildAmzTable() em [js/components/amazon/AmazonDashboard.js](js/components/amazon/AmazonDashboard.js).

A função:

1. aplica filtros de busca e dropdowns;
2. ordena as linhas conforme a coluna clicada;
3. calcula paginação;
4. monta o thead com cabeçalhos clicáveis para ordenação;
5. monta o tbody com badges e valores formatados.

A renderização usa:

- amzFmtSigned() para formatar valores monetários;
- badges para txType;
- destaque para linhas sem orderId (classificadas como GLOBAL).

### 7.2 Tabela da aba ERP (legada, não utilizada no frontend atual)

A tabela antiga era montada por buildErpTable() em [js/components/amazon/AmazonErpDashboard.js](js/components/amazon/AmazonErpDashboard.js).

Ela ainda existe nos arquivos do projeto, mas não é mais utilizada pela interface atual, que passou a depender exclusivamente da aba ERP V2. O motivo é evitar risco de regressão na implementação mais nova, já que a V2 é a camada funcional e ativa.

Em termos práticos, a tabela antiga ficou como código legado preservado por compatibilidade, sem renderização no frontend.

### 7.3 Tabela da aba ERP V2

A tabela é montada por buildErpV2Table() em [js/components/amazon/AmazonErpV2Dashboard.js](js/components/amazon/AmazonErpV2Dashboard.js).

Ela expõe uma visão por pedido mais rica, com colunas como:

- Principal Gross / Refund / Net
- Shipping Gross / Refund / Net
- Commission Gross / Refund / Net
- ShippingHB Gross / Refund / Net
- Flex Fee Gross / Refund / Net
- DBA
- SAFE-T
- Chargeback
- Outros
- Qtd Eventos
- Settlement IDs

---

## 8. Objetos usados para representar um pedido conciliado

A implementação atual utiliza três formas principais de representação.

### 8.1 Objeto de pedido ERP

Gerado por parseErpJVCR4010() em [js/services/amazon/amazonErpService.js](js/services/amazon/amazonErpService.js):

```js
{
  orderId,
  pedidoVenda,
  notaFiscal,
  dtPedidoMarketplace,
  dtEmissao,
  vlVendaERP,
  vlComissaoERP,
  secao
}
```

### 8.2 Objeto enriquecido da conciliação ERP

Gerado por crossErpSettlement() em [js/services/amazon/amazonErpService.js](js/services/amazon/amazonErpService.js):

```js
{
  ...erp,
  principal,
  shipping,
  commission,
  shippingHB,
  flexFee,
  refund,
  refundComm,
  dba,
  safeT,
  chargeback,
  promotion,
  outros,
  settlementIds,
  qtdEventos,
  status
}
```

### 8.3 Objeto da conciliação ERP V2

Gerado em [js/components/amazon/AmazonErpV2Dashboard.js](js/components/amazon/AmazonErpV2Dashboard.js), com base em AMZ_ORDER_MAP:

```js
{
  ...erp,
  principal,
  shipping,
  commission,
  shippingHB,
  flexFee,
  dba,
  safeT,
  refund,
  refundComm,
  chargeback,
  outros,
  settlementIds,
  qtdEventos,
  principalGross,
  principalRefund,
  principalNet,
  shippingGross,
  shippingRefund,
  shippingNet,
  commissionGross,
  commissionRefund,
  commissionNet,
  shippingHBGross,
  shippingHBRefund,
  shippingHBNet,
  flexFeeGross,
  flexFeeRefund,
  flexFeeNet,
  status
}
```

### 8.4 Estrutura agregada por Order ID

Criada em [js/components/amazon/AmazonDashboard.js](js/components/amazon/AmazonDashboard.js) e armazenada em window.AMZ_ORDER_MAP:

```js
{
  principal,
  shipping,
  commission,
  shippingHB,
  flexFee,
  refund,
  refundComm,
  dba,
  safeT,
  chargeback,
  promotion,
  outros,
  settlementIds,
  qtdEventos,
  principalGross,
  principalRefund,
  principalNet,
  shippingGross,
  shippingRefund,
  shippingNet,
  commissionGross,
  commissionRefund,
  commissionNet,
  shippingHBGross,
  shippingHBRefund,
  shippingHBNet,
  flexFeeGross,
  flexFeeRefund,
  flexFeeNet
}
```

---

## 9. Pontos de extensão sem quebrar a arquitetura atual

A arquitetura já tem alguns limites claros, mas também apresenta bons pontos de extensão.

### 9.1 Melhor ponto para novas fontes de dados: camada de parser

A forma mais segura de incluir uma nova fonte é criar um novo parser que retorne uma estrutura compatível com o objeto de evento atual:

```js
{
  txType,
  orderId,
  amtType,
  amtDesc,
  amount,
  sku,
  qty,
  date,
  mktName,
  settlementId
}
```

Assim, o restante do pipeline continua funcionando sem reescrever a lógica de agregação e renderização.

### 9.2 Melhor ponto para novas normalizações: camada de mapeamento semântico

Se uma nova fonte usar outro formato, a adaptação ideal é uma camada de normalização intermediária que converta os dados para o mesmo modelo interno.

Isso evita:

- acoplamento direto aos dashboards;
- quebra das funções aggregateEvents e buildSettlementMap;
- duplicação de lógica de cálculo.

### 9.3 Melhor ponto para novos tipos de evento: categorização por amtDesc

Hoje a classificação financeira depende muito de amtDesc. Para incluir novos eventos, o caminho mais compatível é:

1. adicionar um novo mapeamento de categoria;
2. incluir esse novo tipo na lógica de agrupamento;
3. expor a categoria no mesmo formato usado pelos cards.

### 9.4 Pontos que já estão bem isolados

Os módulos atuais estão separados, mas a camada ERP antiga virou legado:

- entrada/estado: [js/services/amazon/amazonStorage.js](js/services/amazon/amazonStorage.js)
- parsing: [js/services/amazon/amazonParsers.js](js/services/amazon/amazonParsers.js) e [js/services/amazon/amazonErpService.js](js/services/amazon/amazonErpService.js)
- agregação: [js/services/amazon/amazonErpService.js](js/services/amazon/amazonErpService.js)
- renderização ativa: [js/components/amazon/AmazonDashboard.js](js/components/amazon/AmazonDashboard.js) e [js/components/amazon/AmazonErpV2Dashboard.js](js/components/amazon/AmazonErpV2Dashboard.js)
- renderização legada: [js/components/amazon/AmazonErpDashboard.js](js/components/amazon/AmazonErpDashboard.js)

Essa separação é útil para preservar a implementação antiga sem afetar a V2, que é a parte realmente ativa do frontend.

### 9.5 Pontos que ainda são frágeis

Os principais pontos mais acoplados são:

- a classificação financeira depende de strings exatas em amtDesc;
- os dashboards usam nomes de categoria fixos;
- AMZ_ORDER_MAP e AMZ_ERPV2_RESULT são fortemente dependentes da estrutura específica construída pela implementação atual.

Ou seja: novas fontes podem ser adicionadas com segurança se a entrada for normalizada para a mesma estrutura interna. O risco maior está em introduzir uma nova fonte com um formato muito diferente sem uma camada de adaptação.

---

## 10. Resumo executivo

A implementação atual funciona como um pipeline de três etapas:

1. importar e parsear Settlement/ERP;
2. normalizar e agregar eventos por Order ID;
3. renderizar cards e tabelas por aba.

A arquitetura é relativamente bem organizada, com separação entre:

- leitura de arquivos;
- parsing;
- agregação;
- renderização.

O ponto mais importante para entendimento é que a conciliação atual se baseia em uma estrutura interna comum de eventos e em um mapa agregado por Order ID, o que permite que a lógica de dashboard e de tabela continue estável mesmo quando novas fontes ou novas categorias forem adicionadas.

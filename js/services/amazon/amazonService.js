/**
 * services/amazon/amazonService.js
 * Orquestração principal do processamento do Settlement Amazon.
 * Função: processAmazon.
 * Depende de: amzRawFiles (services/amazon/amazonStorage.js),
 * parseAmzTSV (services/amazon/amazonParsers.js), _showAmazonResult
 * (components/amazon/AmazonDashboard.js).
 * Código movido sem alteração de lógica (seção original: AMAZON —
 * MÓDULO, parte de processamento).
 */

function processAmazon() {
  if (!amzRawFiles.length && !AMZ_ERP_ORDERS.length) {
    amzSt('Carregue pelo menos um arquivo.', 'err'); return;
  }
  amzSt('Processando...', '');
  try {
    // 1. Processar Settlements
    const allRows        = [];
    const allSettlements = [];
    amzRawFiles.forEach(({ text }) => {
      const parsed = parseAmzTSV(text);
      if (!parsed) return;
      allSettlements.push(parsed.summary);
      allRows.push(...parsed.rows);
    });
    AMZ_DATA = { rows: allRows, settlements: allSettlements };

    // 2. Montar mapa orderId → eventos
    AMZ_SETTLEMENT_MAP = buildSettlementMap(allRows);

    // 3. Cruzar com ERP se disponível
    AMZ_ERP_RESULT = AMZ_ERP_ORDERS.length
      ? crossErpSettlement(AMZ_ERP_ORDERS, AMZ_SETTLEMENT_MAP)
      : [];

    // 4. Exibir
    _showAmazonResult();
  } catch(err) {
    amzSt('Erro: ' + err.message, 'err');
    console.error(err);
  }
}

// ─── Exibir resultado ─────────────────────────

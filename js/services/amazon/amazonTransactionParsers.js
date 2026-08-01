/**
 * services/amazon/amazonTransactionParsers.js
 * Parser do Transaction Report Amazon.
 * Cria TransactionEvent a partir do arquivo CSV/TSV.
 */
(function() {
  const ROOT = typeof window !== 'undefined' ? window : this;
  if (ROOT.parseAmazonTransactionReport) return;

  function removeBom(text) {
    return String(text || '').replace(/^\uFEFF/, '');
  }

  function normalizeHeader(key) {
    return String(key || '').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }

  function parseNumber(value) {
    if (value === null || value === undefined) return 0;
    const s = String(value).trim().replace(/\s+/g, '');
    if (!s) return 0;
    const normalized = s.replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
  }

  function parseCsv(text, delimiter) {
    const lines = [];
    let current = '';
    let field = '';
    let inQuotes = false;
    const delim = delimiter || ',';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          i += 1;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === delim && !inQuotes) {
        current += field;
        current += '\t';
        field = '';
        continue;
      }
      if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && next === '\n') continue;
        current += field;
        lines.push(current.split('\t'));
        current = '';
        field = '';
        continue;
      }
      field += ch;
    }
    if (field !== '' || current !== '') {
      current += field;
      lines.push(current.split('\t'));
    }
    return lines;
  }

  function detectDelimiter(text) {
    const firstLines = String(text || '').split(/\r?\n/).slice(0, 5);
    const sample = firstLines.join('\n');
    if (sample.includes(';')) return ';';
    if (sample.includes('\t')) return '\t';
    return ',';
  }

  function normalizeKeyMap(headers) {
    const map = {};
    headers.forEach((h, index) => {
      const key = normalizeHeader(h);
      map[key] = index;
    });
    return map;
  }

  function findHeaderRow(rows) {
    const headerCandidates = ['data/hora', 'id de liquidacao', 'tipo', 'id do pedido', 'status da transacao', 'date/time', 'order id', 'transaction status'];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      const normalized = row.map(c => normalizeHeader(c)).join('|');
      const matches = headerCandidates.reduce((count, header) => count + (normalized.includes(header) ? 1 : 0), 0);
      if (matches >= 3) return i;
    }
    return 0;
  }

  function getValue(cols, idx, key) {
    if (idx[key] === undefined) return '';
    return String(cols[idx[key]] || '').trim();
  }

  function parseTransactionStatus(value) {
    const v = String(value || '').trim().toLowerCase();
    if (!v) return '';
    if (v.includes('liberado') || v.includes('released')) return 'Liberado';
    if (v.includes('diferido') || v.includes('deferred')) return 'Diferido';
    return value;
  }

  function ensureString(value) {
    return value === null || value === undefined ? '' : String(value);
  }

  function parseAmazonTransactionReport(text, options) {
    options = options || {};
    const fileName = options.fileName || 'transaction-report';
    const body = removeBom(text);
    const delimiter = detectDelimiter(body);
    const rows = parseCsv(body, delimiter).filter(r => r.length && r.some(c => c !== undefined && c !== ''));
    if (!rows.length) throw new Error('Transaction Report vazio ou inválido.');
    const headerRowIndex = findHeaderRow(rows);
    const headers = rows[headerRowIndex].map(c => normalizeHeader(c));
    const idx = normalizeKeyMap(rows[headerRowIndex]);
    const events = [];
    const rawRows = rows.slice(headerRowIndex + 1);

    rawRows.forEach((cols, rowIndex) => {
      if (cols.length === 1 && !cols[0]) return;
      const transactionDate = getValue(cols, idx, 'data/hora') || getValue(cols, idx, 'date/time');
      const settlementId = getValue(cols, idx, 'id de liquidacao') || getValue(cols, idx, 'settlement-id');
      const transactionType = getValue(cols, idx, 'tipo') || getValue(cols, idx, 'type');
      const orderId = getValue(cols, idx, 'id do pedido') || getValue(cols, idx, 'order id') || getValue(cols, idx, 'order-id');
      const sku = getValue(cols, idx, 'sku');
      const description = getValue(cols, idx, 'descricao') || getValue(cols, idx, 'description');
      const quantity = getValue(cols, idx, 'quantidade') || getValue(cols, idx, 'quantity');
      const marketplace = getValue(cols, idx, 'mercado') || getValue(cols, idx, 'marketplace');
      const fulfillment = getValue(cols, idx, 'atendimento') || getValue(cols, idx, 'fulfillment');
      const city = getValue(cols, idx, 'cidade do pedido') || getValue(cols, idx, 'city');
      const state = getValue(cols, idx, 'estado do pedido') || getValue(cols, idx, 'state');
      const postalCode = getValue(cols, idx, 'postal do pedido') || getValue(cols, idx, 'postal code');
      const productSales = parseNumber(getValue(cols, idx, 'vendas do produto') || getValue(cols, idx, 'product sales'));
      const shippingCredits = parseNumber(getValue(cols, idx, 'creditos de remessa') || getValue(cols, idx, 'shipping credits'));
      const giftWrapCredits = parseNumber(getValue(cols, idx, 'creditos de embalagem de presente') || getValue(cols, idx, 'gift wrap credits'));
      const promotionalDiscounts = parseNumber(getValue(cols, idx, 'descontos promocionais') || getValue(cols, idx, 'promotional discounts'));
      const salesTaxCollected = parseNumber(getValue(cols, idx, 'imposto de vendas coletados') || getValue(cols, idx, 'sales tax collected'));
      const sellingFees = parseNumber(getValue(cols, idx, 'tarifas de venda') || getValue(cols, idx, 'selling fees'));
      const fbaFees = parseNumber(getValue(cols, idx, 'taxas fba') || getValue(cols, idx, 'fba fees'));
      const otherTransactionFees = parseNumber(getValue(cols, idx, 'taxas de outras transacoes') || getValue(cols, idx, 'other transaction fees'));
      const other = parseNumber(getValue(cols, idx, 'outro') || getValue(cols, idx, 'other'));
      const total = parseNumber(getValue(cols, idx, 'total'));
      const transactionStatus = parseTransactionStatus(getValue(cols, idx, 'status da transacao') || getValue(cols, idx, 'status'));
      const transactionReleaseDate = getValue(cols, idx, 'data de liberacao da transacao') || getValue(cols, idx, 'transaction release date');

      const invalidNumberFields = [];
      ['productSales','shippingCredits','giftWrapCredits','giftWrapCredits','promotionalDiscounts','salesTaxCollected','sellingFees','fbaFees','otherTransactionFees','other','total'].forEach(field => {
        const value = { productSales, shippingCredits, giftWrapCredits, promotionalDiscounts, salesTaxCollected, sellingFees, fbaFees, otherTransactionFees, other, total }[field];
        if (typeof value !== 'number' || Number.isNaN(value)) invalidNumberFields.push(field);
      });

      events.push({
        transactionEventId: `${fileName}:${rowIndex + 2}`,
        fileName,
        rowIndex: rowIndex + 2,
        transactionDate: ensureString(transactionDate),
        settlementId: ensureString(settlementId),
        transactionType: ensureString(transactionType),
        orderId: ensureString(orderId),
        sku: ensureString(sku),
        description: ensureString(description),
        quantity: ensureString(quantity),
        marketplace: ensureString(marketplace),
        fulfillment: ensureString(fulfillment),
        city: ensureString(city),
        state: ensureString(state),
        postalCode: ensureString(postalCode),
        productSales,
        shippingCredits,
        giftWrapCredits,
        promotionalDiscounts,
        salesTaxCollected,
        sellingFees,
        fbaFees,
        otherTransactionFees,
        other,
        total,
        transactionStatus,
        transactionReleaseDate: ensureString(transactionReleaseDate),
        invalidNumberFields,
      });
    });

    const uniqueSettlementIds = Array.from(new Set(events.map(e => e.settlementId).filter(Boolean)));
    const uniqueOrderIds = Array.from(new Set(events.map(e => e.orderId).filter(Boolean)));
    const metadata = { fileName, delimiter, rowCount: rawRows.length, uniqueSettlementIds, uniqueOrderIds };

    return { fileName, metadata, rawRows, events };
  }

  ROOT.parseAmazonTransactionReport = parseAmazonTransactionReport;
})();

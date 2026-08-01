/**
 * services/amazon/amazonSettlementParsers.js
 * Parser do Settlement Amazon para validação inicial.
 * Suporta tanto o formato TSV/CSV com linha de resumo quanto arquivos de detalhe.
 */
(function() {
  const ROOT = typeof window !== 'undefined' ? window : this;
  if (ROOT.parseAmazonSettlement) return;

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

  function parseDelimitedText(text, delimiter) {
    const lines = [];
    let field = '';
    let inQuotes = false;
    const delim = delimiter || ';';
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
        lines.push(field);
        field = '';
        continue;
      }
      if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && next === '\n') continue;
        lines.push(field);
        lines.push('\n');
        field = '';
        continue;
      }
      field += ch;
    }
    if (field !== '') lines.push(field);

    const rows = [];
    let current = [];
    lines.forEach(token => {
      if (token === '\n') {
        rows.push(current);
        current = [];
      } else {
        current.push(token);
      }
    });
    if (current.length) rows.push(current);
    return rows;
  }

  function detectDelimiter(text) {
    const lines = String(text || '').split(/\r?\n/).filter(Boolean).slice(0, 5);
    const sample = lines.join('\n');
    if (sample.includes('\t')) return '\t';
    if (sample.includes(';')) return ';';
    if (sample.includes(',')) return ',';
    return ';';
  }

  function normalizeKeyMap(headers) {
    const map = {};
    headers.forEach((h, index) => {
      map[normalizeHeader(h)] = index;
    });
    return map;
  }

  function findHeaderRow(rows) {
    const headerCandidates = ['tipo', 'order id', 'sku', 'data', 'rec bruta', 'liquido', 'valor', 'qtd'];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      const normalized = row.map(c => normalizeHeader(c)).join('|');
      const matches = headerCandidates.reduce((count, header) => count + (normalized.includes(header) ? 1 : 0), 0);
      if (matches >= 3) return i;
    }
    return 0;
  }

  function getValue(cols, idx, keys) {
    keys = Array.isArray(keys) ? keys : [keys];
    for (const key of keys) {
      if (idx[key] !== undefined) {
        return String(cols[idx[key]] || '').trim();
      }
    }
    return '';
  }

  function parseAmazonSettlement(text, options) {
    options = options || {};
    const fileName = options.fileName || 'settlement';
    const body = removeBom(text);
    const delimiter = detectDelimiter(body);
    const rows = parseDelimitedText(body, delimiter).filter(r => r.length && r.some(c => c !== undefined && c !== ''));
    if (!rows.length) throw new Error('Settlement vazio ou inválido.');

    const headerRowIndex = findHeaderRow(rows);
    const headers = rows[headerRowIndex].map(c => normalizeHeader(c));
    const idx = normalizeKeyMap(rows[headerRowIndex]);
    let summary = { settlementId: '', settlementStartDate: '', settlementEndDate: '', totalAmount: 0, fileName };
    const detailRows = [];
    let detailStart = headerRowIndex + 1;

    if (idx['settlement-id'] !== undefined || idx['settlement-start-date'] !== undefined || idx['total-amount'] !== undefined) {
      const s1 = rows[1] || [];
      summary = {
        settlementId: getValue(s1, idx, 'settlement-id'),
        settlementStartDate: getValue(s1, idx, 'settlement-start-date'),
        settlementEndDate: getValue(s1, idx, 'settlement-end-date'),
        totalAmount: parseNumber(getValue(s1, idx, 'total-amount')),
        fileName,
      };
      detailStart = 2;
    }

    const settlementRows = [];
    const orderIdSet = new Set();
    const settlementIdSet = new Set();
    let minDate = null;
    let maxDate = null;
    let totalNet = 0;

    for (let i = detailStart; i < rows.length; i++) {
      const cols = rows[i];
      if (!cols || !cols.length) continue;

      const txType = getValue(cols, idx, ['transaction-type', 'tipo', 'type']);
      const orderId = getValue(cols, idx, ['order-id', 'order id', 'orderid', 'pedido']);
      const amtType = getValue(cols, idx, ['amount-type', 'amount type']);
      const amtDesc = getValue(cols, idx, ['amount-description', 'amount description', 'descricao', 'description']);
      const amount = parseNumber(getValue(cols, idx, ['amount', 'valor', 'principal', 'shipping', 'comissao', 'comissao', 'taxa parcelamento', 'taxas fba', 'other', 'outras taxas', 'liquido']));
      const sku = getValue(cols, idx, ['sku']);
      const quantity = getValue(cols, idx, ['quantity-purchased', 'quantity', 'qtd']);
      const date = getValue(cols, idx, ['posted-date', 'data', 'date']);
      const marketplaceName = getValue(cols, idx, ['marketplace-name', 'marketplace']);
      const settlementId = summary.settlementId || getValue(cols, idx, ['settlement-id', 'id de liquidação', 'id de liquidacao']);

      if (settlementId) settlementIdSet.add(settlementId);
      if (orderId) orderIdSet.add(orderId);
      if (date) {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          if (!minDate || parsed < minDate) minDate = parsed;
          if (!maxDate || parsed > maxDate) maxDate = parsed;
        }
      }
      if (typeof amount === 'number') totalNet += amount;

      settlementRows.push({
        settlementRowId: `${fileName}:${i + 1}`,
        fileName,
        settlementId: settlementId || '',
        orderId: orderId || '',
        txType: txType || '',
        amtType: amtType || '',
        amtDesc: amtDesc || '',
        amount,
        sku: sku || '',
        quantity: quantity || '',
        date: date || '',
        marketplaceName: marketplaceName || '',
      });
    }

    if (!summary.settlementStartDate && minDate) summary.settlementStartDate = minDate.toISOString().slice(0, 10);
    if (!summary.settlementEndDate && maxDate) summary.settlementEndDate = maxDate.toISOString().slice(0, 10);
    if (!summary.totalAmount) summary.totalAmount = totalNet;
    if (!summary.settlementId && fileName) {
      const match = fileName.match(/(\d{9,})/);
      if (match) summary.settlementId = match[1];
    }

    if (settlementIdSet.size === 1 && !summary.settlementId) {
      summary.settlementId = Array.from(settlementIdSet)[0];
    }

    return {
      fileName,
      metadata: { fileName, delimiter, rowCount: settlementRows.length },
      summary,
      rows: settlementRows,
    };
  }

  ROOT.parseAmazonSettlement = parseAmazonSettlement;
})();

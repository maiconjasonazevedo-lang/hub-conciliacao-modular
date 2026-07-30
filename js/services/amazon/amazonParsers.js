/**
 * services/amazon/amazonParsers.js
 * Parser do relatório de Settlement Amazon (TSV).
 * Função: parseAmzTSV.
 * Código movido sem alteração de lógica (seção original: AMAZON —
 * MÓDULO, parte de parser).
 */

function parseAmzTSV(text) {
  const lines = text.split(/\r?\n/);
  if (!lines.length) return null;

  // Linha 0: headers
  const headers = lines[0].split('\t');
  const idx = {};
  headers.forEach((h, i) => { idx[h.trim()] = i; });

  // Linha 1: resumo do settlement
  const s1 = lines[1] ? lines[1].split('\t') : [];
  const summary = {
    id          : (s1[idx['settlement-id']] || '').trim(),
    startDate   : (s1[idx['settlement-start-date']] || '').trim(),
    endDate     : (s1[idx['settlement-end-date']]   || '').trim(),
    depositDate : (s1[idx['deposit-date']]          || '').trim(),
    totalAmount : amzN(s1[idx['total-amount']]),
  };

  const rows = [];

  // Linhas 2+: transações
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = lines[i].split('\t');
    const get  = key => idx[key] !== undefined ? (cols[idx[key]] || '').trim() : '';

    const txType  = get('transaction-type');
    const orderId = get('order-id');
    const amtType = get('amount-type');
    const amtDesc = get('amount-description');
    const amount  = amzN(get('amount'));
    const sku     = get('sku');
    const qty     = get('quantity-purchased');
    const date    = get('posted-date');
    const mktName = get('marketplace-name');

    // Ignorar linha de totais do settlement (txType vazio e sem order-id)
    if (!txType && !orderId && !amtDesc) continue;

    rows.push({ txType, orderId, amtType, amtDesc, amount, sku, qty, date, mktName, settlementId: summary.id });
  }

  return { summary, rows };
}

// ─── Processar ────────────────────────────────

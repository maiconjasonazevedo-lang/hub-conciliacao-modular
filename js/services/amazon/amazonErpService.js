/**
 * services/amazon/amazonErpService.js
 * Estado, upload/parser do relatório ERP (JVCR4010) e cruzamento com
 * o settlement Amazon.
 * Estado: AMZ_ERP_ORDERS, AMZ_ERP_RESULT, AMZ_SETTLEMENT_MAP, erpPage, ERP_PS.
 * Funções: loadAmzErp, parseErpJVCR4010, buildSettlementMap,
 * aggregateEvents, calcStatus, crossErpSettlement.
 * Depende de: AMZ_DATA (services/amazon/amazonStorage.js).
 * Código movido sem alteração de lógica (seção original: AMAZON ERP —
 * PARSER + CRUZAMENTO, parte de estado/parser/cruzamento).
 */

// ══════════════════════════════════════════════
// AMAZON ERP — PARSER + CRUZAMENTO
// ══════════════════════════════════════════════

let AMZ_ERP_ORDERS     = [];   // pedidos parseados do JVCR4010
let AMZ_ERP_RESULT     = [];   // resultado do cruzamento
let AMZ_SETTLEMENT_MAP = {};   // orderId → array de eventos
let erpPage            = 1;
const ERP_PS           = 50;

// ─── Upload ERP ───────────────────────────────
function loadAmzErp(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      AMZ_ERP_ORDERS = parseErpJVCR4010(e.target.result);
      document.getElementById('uc-amz-erp').classList.add('done');
      document.getElementById('fn-amz-erp').textContent = '✓ ' + file.name + ' — ' + AMZ_ERP_ORDERS.length + ' pedidos';
      document.getElementById('amz-proc-btn').disabled = false;
      amzSt('✓ ERP carregado: ' + AMZ_ERP_ORDERS.length + ' pedidos.', 'ok');
    } catch(err) {
      amzSt('Erro ao ler ERP: ' + err.message, 'err');
      console.error(err);
    }
  };
  reader.readAsText(file, 'utf-8');
  evt.target.value = '';
}

// ─── Parser JVCR4010 (SpreadsheetML) ──────────
function parseErpJVCR4010(xmlText) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(xmlText, 'text/xml');
  const NS     = 'urn:schemas-microsoft-com:office:spreadsheet';

  const allRows = Array.from(doc.getElementsByTagNameNS(NS, 'Row'));
  const orders  = [];
  let section   = 'faturados';
  let erpPeriodStart = '', erpPeriodEnd = '';

  for (const row of allRows) {
    const cells = Array.from(row.getElementsByTagNameNS(NS, 'Cell'));
    const vals  = cells.map(c => {
      const d = c.getElementsByTagNameNS(NS, 'Data')[0];
      return d ? (d.textContent || '').trim() : '';
    });

    if (!vals.length || !vals.some(v => v)) continue;

    const v0 = vals[0];
    const v1 = vals[1] || '';

    // Detectar período no cabeçalho do ERP (linha "Data: 01/03/2026 até 31/03/2026" ou similar)
    if (v0.startsWith('Data') && v0.includes('/')) {
      const m = v0.match(/(\d{2}\/\d{2}\/\d{4}).*?(\d{2}\/\d{2}\/\d{4})/);
      if (m) { erpPeriodStart = m[1]; erpPeriodEnd = m[2]; }
    }
    // Também tenta pegar de coluna separada: "Período" / "De" / "Até"
    if (v0 === 'Período' || v0 === 'De' || v0 === 'Data inicial') {
      if (v1) erpPeriodStart = v1;
    }

    if (v0 === 'Cancelados Pós Pagamento') { section = 'cancelados'; continue; }
    if (v0 === 'Faturados')               { section = 'faturados';   continue; }
    if (v0 === 'Pedido Marketplace') continue;
    if (v1 === 'Total:' || v1 === 'Total dia:') continue;
    if (v0.startsWith('Dt.') || v0.startsWith('Data') || v0.startsWith('Parâmetro') ||
        v0.startsWith('Marketplace') || v0.startsWith('Comissão') || v0.startsWith('Data/Hora')) continue;
    if (v0.startsWith('%') || v0.startsWith('Total')) continue;
    if (v0 === '1' || v0 === ' de ') continue;
    if (!/^\d{3}-\d{7}-\d{7}$/.test(v0)) continue;

    if (section === 'faturados' && vals.length >= 7) {
      orders.push({
        orderId             : v0,
        pedidoVenda         : vals[1] || '',
        notaFiscal          : vals[2] || '',
        dtPedidoMarketplace : vals[3] || '',
        dtEmissao           : vals[4] || '',
        vlVendaERP          : amzN(vals[5]),
        vlComissaoERP       : amzN(vals[6]),
        secao               : 'faturado',
      });
    } else if (section === 'cancelados' && vals.length >= 4) {
      orders.push({
        orderId             : v0,
        pedidoVenda         : '',
        notaFiscal          : '',
        dtPedidoMarketplace : vals[1] || '',
        dtEmissao           : '',
        vlVendaERP          : amzN(vals[2]),
        vlComissaoERP       : amzN(vals[3]),
        secao               : 'cancelado',
      });
    }
  }

  // Fallback período: usar datas dos pedidos se não encontrou no cabeçalho
  if (!erpPeriodStart && orders.length) {
    const dts = orders.map(o => o.dtEmissao || o.dtPedidoMarketplace).filter(Boolean).sort();
    if (dts.length) { erpPeriodStart = dts[0]; erpPeriodEnd = dts[dts.length-1]; }
  }

  orders._periodStart = erpPeriodStart;
  orders._periodEnd   = erpPeriodEnd;
  return orders;
}

// ─── Montar mapa settlement ────────────────────
function buildSettlementMap(rows) {
  const map = {};
  for (const r of rows) {
    if (!r.orderId || r.orderId === '—') continue;
    if (!map[r.orderId]) map[r.orderId] = [];
    map[r.orderId].push(r);
  }
  return map;
}

// ─── Agregar eventos de um pedido ─────────────
function aggregateEvents(events) {
  const agg = {
    principal   : 0,
    shipping    : 0,
    commission  : 0,
    shippingHB  : 0,
    flexFee     : 0,
    refund      : 0,
    refundComm  : 0,
    dba         : 0,   // DBA / Easy Ship
    safeT       : 0,
    chargeback  : 0,
    promotion   : 0,
    outros      : 0,
    settlementIds: new Set(),
    qtdEventos  : 0,
  };

  for (const ev of events) {
    agg.qtdEventos++;
    if (ev.settlementId) agg.settlementIds.add(ev.settlementId);

    const tx   = ev.txType   || '';
    const at   = ev.amtType  || '';
    const desc = ev.amtDesc  || '';
    const amt  = ev.amount   || 0;

    if (tx === 'Order') {
      if (at === 'ItemPrice') {
        if (desc === 'Principal')  agg.principal  += amt;
        else if (desc === 'Shipping') agg.shipping += amt;
        else agg.outros += amt;
      } else if (at === 'ItemFees') {
        if (desc === 'Commission')                           agg.commission += amt;
        else if (desc === 'ShippingHB')                     agg.shippingHB += amt;
        else if (desc === 'Flexible Customer Financing fee') agg.flexFee    += amt;
        else agg.outros += amt;
      } else if (at === 'Promotion') {
        agg.promotion += amt;
      } else {
        agg.outros += amt;
      }
    } else if (tx === 'Refund') {
      if (desc === 'Commission') agg.refundComm += amt;
      else agg.refund += amt;
    } else if (tx === 'Chargeback Refund') {
      agg.chargeback += amt;
    } else if (tx === 'other-transaction') {
      if (desc.toLowerCase().includes('safe-t')) agg.safeT += amt;
      else agg.dba += amt;
    } else {
      agg.outros += amt;
    }
  }

  agg.settlementIds = [...agg.settlementIds].join(', ');
  return agg;
}

// ─── Calcular status ──────────────────────────
function calcStatus(agg, hasEvents) {
  if (!hasEvents)             return 'missing';  // ❌
  if (agg.commission === 0)   return 'partial';  // ⚠️ sem commission
  if (agg.principal  === 0)   return 'partial';  // ⚠️ sem principal
  return 'found';                                 // ✅
}

// ─── Cruzamento ERP × Settlement ──────────────
function crossErpSettlement(erpOrders, settlementMap) {
  return erpOrders.map(erp => {
    const events   = settlementMap[erp.orderId] || [];
    const hasEvents = events.length > 0;
    const agg      = aggregateEvents(events);
    const status   = calcStatus(agg, hasEvents);
    return { ...erp, ...agg, status };
  });
}

// ─── Renderizar aba ERP ───────────────────────

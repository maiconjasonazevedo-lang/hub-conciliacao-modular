/**
 * components/amazon/AmazonDashboard.js
 * Renderização do resultado do Settlement Amazon (tabela, abas,
 * paginação).
 * Funções: _showAmazonResult, buildAmzTable, amzShowTab.
 * Depende de: AMZ_DATA/amzPage/AMZ_PS (services/amazon/amazonStorage.js).
 * Código movido sem alteração de lógica (seção original: AMAZON —
 * MÓDULO, parte de renderização).
 */

function _showAmazonResult() {
  if (!AMZ_DATA) AMZ_DATA = { rows: [], settlements: [] };
  const { rows, settlements } = AMZ_DATA;

  const hasOrderId = r => r.orderId && r.orderId.trim() && r.orderId !== '—';
  const sum        = arr => arr.reduce((s,r) => s + r.amount, 0);
  const fml        = v   => 'R$ ' + Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmlS       = v   => v === 0 ? '<span class="vzero">+R$ 0,00</span>' : (v < 0 ? '-' : '+') + 'R$ ' + Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

  // ── Classificadores ──────────────────────────
  // Classificação exclusivamente por amtDesc (igualdade exata).
  // txType e amtType NÃO decidem categoria financeira — apenas filtros/auditoria.
  // Cada linha entra em exatamente UMA categoria; a ordem importa.
  const byDesc = desc => rows.filter(r => (r.amtDesc || '').trim() === desc);

  const byDescs = (...descs) => rows.filter(r => descs.includes((r.amtDesc || '').trim()));

  const cat = {
    // Receita
    principal    : byDesc('Principal'),
    shipping     : byDesc('Shipping'),

    // Fees operacionais
    commission   : byDesc('Commission'),
    shippingHB   : byDesc('ShippingHB'),
    flexFee      : byDescs('Flexible Financing Fee', 'Flexible Customer Financing fee'),

    // Logística
    easyShip     : byDesc('Amazon Easy Ship Charges'),

    // Devoluções
    refundPrinc  : byDesc('Refund Principal'),
    refundComm   : byDescs('Refund Commission', 'RefundCommission'),

    // Globais
    advertising  : byDescs('Cost of Advertising', 'TransactionTotalAmount'),
    reembolso    : byDescs('Inventory Reimbursement', 'Reimbursement for Lost packages'),
    safeT        : byDescs('SAFE-T Claim', 'SAFE-T reimbursement'),
  };

  // Conjunto de ids já classificados para calcular resíduos
  const classified = new Set([
    ...cat.principal, ...cat.shipping, ...cat.commission, ...cat.shippingHB,
    ...cat.flexFee, ...cat.easyShip, ...cat.refundPrinc, ...cat.refundComm,
    ...cat.advertising, ...cat.reembolso, ...cat.safeT,
  ]);
  const residuos = rows.filter(r => !classified.has(r) && r.amtDesc && r.amount !== 0);

  // ── AMZ_ORDER_MAP — fonte oficial para ERP V2 ─
  // Construído exclusivamente a partir dos arrays cat.* (classificados por amtDesc exato).
  // NÃO usa txType, amtType nem heurísticas — reflete exatamente os cards do Settlement.
  window.AMZ_ORDER_MAP = (() => {
    const map = {};
    const acc = (orderId, field, amount) => {
      if (!orderId || orderId === '—') return;
      if (!map[orderId]) map[orderId] = {
        // ── campos líquidos existentes (NÃO alterar) ──
        principal: 0, shipping: 0, commission: 0, shippingHB: 0,
        flexFee: 0, refund: 0, refundComm: 0, dba: 0, safeT: 0,
        chargeback: 0, promotion: 0, outros: 0,
        settlementIds: new Set(), qtdEventos: 0,
        // ── novos campos Gross / Refund / Net por categoria ──
        principalGross: 0, principalRefund: 0, principalNet: 0,
        shippingGross:  0, shippingRefund:  0, shippingNet:  0,
        commissionGross:0, commissionRefund:0, commissionNet:0,
        shippingHBGross:0, shippingHBRefund:0, shippingHBNet:0,
        flexFeeGross:   0, flexFeeRefund:   0, flexFeeNet:   0,
      };
      map[orderId][field] += amount;
    };

    // accGRN — acumula em Gross ou Refund conforme sinal, e sempre em Net
    // field deve ser o prefixo sem sufixo (ex: 'principal')
    const accGRN = (orderId, prefix, amount) => {
      if (!orderId || orderId === '—') return;
      // garante que a entrada existe (acc já faz isso, mas pode ser chamado antes)
      if (!map[orderId]) acc(orderId, prefix, 0); // inicializa sem somar
      if (amount >= 0) {
        map[orderId][prefix + 'Gross']  += amount;
      } else {
        map[orderId][prefix + 'Refund'] += amount;
      }
      map[orderId][prefix + 'Net'] += amount;
    };

    const reg = (arr, field) => arr.forEach(r => {
      acc(r.orderId, field, r.amount);
      if (map[r.orderId]) {
        map[r.orderId].qtdEventos++;
        if (r.settlementId) map[r.orderId].settlementIds.add(r.settlementId);
      }
    });

    // ── campos líquidos existentes — comportamento idêntico ao original ──
    reg(cat.principal,   'principal');
    reg(cat.shipping,    'shipping');
    reg(cat.commission,  'commission');
    reg(cat.shippingHB,  'shippingHB');
    reg(cat.flexFee,     'flexFee');
    reg(cat.refundPrinc, 'refund');
    reg(cat.refundComm,  'refundComm');
    reg(cat.easyShip,    'dba');
    reg(cat.safeT,       'safeT');
    reg(cat.advertising, 'outros');
    reg(cat.reembolso,   'outros');
    residuos.forEach(r => {
      acc(r.orderId, 'outros', r.amount);
      if (map[r.orderId]) {
        map[r.orderId].qtdEventos++;
        if (r.settlementId) map[r.orderId].settlementIds.add(r.settlementId);
      }
    });

    // ── novos acumuladores Gross / Refund / Net ──
    // Rodam APÓS reg() para garantir que o mapa já existe para cada orderId.
    // Classificação exclusivamente por amtDesc, sinal do amount decide Gross vs Refund.
    // cat.principal já contém tanto vendas (+) quanto estornos diretos (-)
    // cat.refundPrinc (amtDesc='Refund Principal') também pertence ao grupo — incluso aqui
    // A união dos dois garante que principalNet = líquido real sem dupla contagem
    const principalAll = [...cat.principal, ...cat.refundPrinc];
    principalAll.forEach(r   => accGRN(r.orderId, 'principal',   r.amount));
    cat.shipping.forEach(r   => accGRN(r.orderId, 'shipping',    r.amount));
    cat.commission.forEach(r => accGRN(r.orderId, 'commission',  r.amount));
    cat.shippingHB.forEach(r => accGRN(r.orderId, 'shippingHB',  r.amount));
    cat.flexFee.forEach(r    => accGRN(r.orderId, 'flexFee',     r.amount));

    // Serializar Sets
    Object.values(map).forEach(v => {
      v.settlementIds = [...v.settlementIds].join(', ');
    });
    return map;
  })();

  const pedidosUnicos = new Set(rows.map(r=>r.orderId).filter(id => id && id.trim() && id !== '—')).size;
  const totalRepasse  = settlements.reduce((s,st) => s + (st.totalAmount||0), 0);

  // ── Helper de card ────────────────────────────
  const tipHtml = tip => tip
    ? `<i class="tip-icon">?<span class="tip-box">${tip}</span></i>`
    : '';
  const card = (lbl, val, sub, cor, sinal=false, tip='') => {
    if (!val && val !== 0) return '';
    const display = sinal ? fmlS(val) : fml(val);
    const color   = cor || (val >= 0 ? 'var(--green)' : 'var(--red)');
    return `<div class="card" style="border-top:2px solid ${cor||'var(--border2)'}"><div class="card-lbl">${lbl}${tipHtml(tip)}</div><div class="card-val" style="color:${color}">${display}</div><div class="card-sub">${sub}</div></div>`;
  };

  // ── Renderizar ────────────────────────────────
  document.getElementById('amz-cards').innerHTML =
    // Cabeçalho contagem
    `<div class="card" style="border-top:2px solid #ff9900"><div class="card-lbl">📦 Pedidos únicos</div><div class="card-val" style="color:#ff9900">${pedidosUnicos}</div><div class="card-sub">${rows.length} linhas no settlement</div></div>` +

    // Receita
    card('💵 Principal',   sum(cat.principal),  cat.principal.length  + ' eventos · amtDesc=Principal',            'var(--green)', false,
      '<b>Principal</b>Valor dos produtos vendidos repassado pela Amazon.<br><br>Origem: amtDesc = <i>Principal</i><br>Quem paga: Cliente<br>Impacto: receita bruta dos produtos.') +
    card('🚚 Shipping',    sum(cat.shipping),   cat.shipping.length   + ' eventos · amtDesc=Shipping',             'var(--green)', false,
      '<b>Shipping</b>Frete cobrado do cliente e repassado no settlement.<br><br>Origem: amtDesc = <i>Shipping</i><br>Quem paga: Cliente<br>Impacto: aumenta o repasse.') +

    // Fees operacionais
    card('💳 Commission',  sum(cat.commission), cat.commission.length + ' eventos · amtDesc=Commission',           'var(--red)', false,
      '<b>Commission</b>Comissão cobrada pela Amazon sobre o valor da venda. Sempre negativa no settlement.<br><br>Origem: amtDesc = <i>Commission</i><br>Quem paga: Vendedor<br>Impacto: reduz o repasse.') +
    card('📦 ShippingHB',  sum(cat.shippingHB), cat.shippingHB.length + ' eventos · amtDesc=ShippingHB',          'var(--red)', false,
      '<b>ShippingHB / FBA</b>Taxa logística ou fulfillment cobrada pela Amazon (FBA, ShippingHB).<br><br>Origem: amtDesc = <i>ShippingHB</i><br>Quem paga: Vendedor<br>Impacto: reduz o repasse.') +
    (cat.flexFee.length ? card('📐 Flex Fee', sum(cat.flexFee), cat.flexFee.length + ' eventos · amtDesc=Flexible Financing Fee', 'var(--red)', false,
      '<b>Flex Fee</b>Custo financeiro do parcelamento flexível oferecido ao cliente.<br><br>Origem: amtDesc = <i>Flexible Customer Financing fee</i><br>Quem paga: Vendedor<br>Impacto: reduz o repasse.') : '') +

    // Logística
    (cat.easyShip.length ? card('📬 Easy Ship', sum(cat.easyShip), cat.easyShip.length + ' eventos · amtDesc=Amazon Easy Ship Charges', '#fb923c', false,
      '<b>DBA / Easy Ship</b>Custos logísticos do serviço Easy Ship (coleta e entrega pela Amazon).<br><br>Origem: amtDesc = <i>Amazon Easy Ship Charges</i><br>Quem paga: Vendedor<br>Impacto: reduz o repasse.') : '') +

    // Devoluções
    (cat.refundPrinc.length ? card('🔁 Refund Principal',  sum(cat.refundPrinc), cat.refundPrinc.length + ' eventos · amtDesc=Refund Principal',  '#f87171', false,
      '<b>Refund Principal</b>Devolução do valor do produto ao cliente. Evento negativo no settlement.<br><br>Origem: amtDesc = <i>Refund Principal</i><br>Quem paga: Vendedor (estorno)<br>Impacto: reduz o repasse.') : '') +
    (cat.refundComm.length  ? card('🔁 Refund Commission', sum(cat.refundComm),  cat.refundComm.length  + ' eventos · amtDesc=Refund Commission', '#f87171', false,
      '<b>Refund Commission</b>Comissão parcialmente devolvida em caso de refund. A Amazon pode reter parte como taxa administrativa.<br><br>Origem: amtDesc = <i>RefundCommission</i><br>Impacto: compensa parcialmente a perda do refund.') : '') +

    // Globais categorizados
    (cat.advertising.length ? card('📢 Advertising Amazon', sum(cat.advertising), cat.advertising.length + ' evento(s) · amtDesc=Cost of Advertising',    '#f87171', false,
      '<b>Advertising</b>Custo de campanhas publicitárias (Sponsored Products, Brands etc.) debitado no settlement.<br><br>Origem: amtDesc = <i>Cost of Advertising</i><br>Quem paga: Vendedor<br>Impacto: reduz o repasse.') : '') +
    (cat.reembolso.length   ? card('♻️ Reembolsos Amazon',  sum(cat.reembolso),  cat.reembolso.length  + ' evento(s) · amtDesc=Inventory Reimbursement', '#34d399', false,
      '<b>Reembolsos Amazon</b>Reembolsos administrativos da Amazon por itens perdidos ou danificados em estoque FBA.<br><br>Origem: amtDesc = <i>Inventory Reimbursement</i><br>Impacto: aumenta o repasse.') : '') +
    (cat.safeT.length       ? card('🛡️ SAFE-T',            sum(cat.safeT),      cat.safeT.length      + ' evento(s) · amtDesc=SAFE-T Claim',            '#a78bfa', false,
      '<b>SAFE-T</b>Reembolso ou ajuste administrativo do programa SAFE-T (cobertura de disputas e reembolsos protegidos).<br><br>Origem: amtDesc = <i>SAFE-T Claim</i><br>Pode ser crédito (reembolso) ou débito (estorno).') : '') +

    // Residuos
    (residuos.length ? card('⚠️ Não Classificados', sum(residuos), residuos.length + ' eventos sem categoria mapeada', '#6b7280', false,
      '<b>Não Classificados</b>Eventos cujo amtDesc não se encaixa em nenhuma categoria mapeada. Revisar manualmente para identificar novos tipos de evento.') : '') +

    // Repasse final
    card('🏦 Total Repasse', totalRepasse, settlements.length + ' settlement(s) · total-amount', 'var(--purple)', false,
      '<b>Total Repasse</b>Valor total que a Amazon vai transferir (ou transferiu) para o vendedor neste período de settlement. Calculado pelo campo <i>total-amount</i> do arquivo.<br><br>É a soma de todos os eventos financeiros positivos e negativos do período.');

  // Period label — usar start/end-date dos settlements, não posted-date das linhas
  const starts = settlements.map(s => s.startDate).filter(Boolean).sort();
  const ends   = settlements.map(s => s.endDate).filter(Boolean).sort();
  const pStart = starts[0]                  ? starts[0].substring(0,10)              : '';
  const pEnd   = ends.length               ? ends[ends.length-1].substring(0,10)    : '';
  const pLabel = pStart && pEnd ? `📅 ${pStart} – ${pEnd} · ${rows.length} linhas` : `${rows.length} linhas`;
  document.getElementById('amz-period').textContent = pLabel;

  amzPage = 1;
  buildAmzTable();

  document.getElementById('amazon-app').style.display         = 'block';
  document.getElementById('amz-upload-screen').style.display  = 'none';
  document.getElementById('amz-result-screen').style.display  = 'block';

  amzShowTab('settlement');
  renderErpTab();
  renderErpV2Tab();
}

// ─── Tabela linha a linha ─────────────────────
function buildAmzTable() {
  if (!AMZ_DATA) return;
  const q     = (document.getElementById('amz-q').value || '').toLowerCase();
  const fTipo = document.getElementById('amz-f-tipo').value;
  const fAmt  = document.getElementById('amz-f-amttype').value;

  const hasOrderId = r => r.orderId && r.orderId.trim() && r.orderId !== '—';

  let rows = AMZ_DATA.rows.filter(r => {
    // Filtro toolbar: tipo
    if (fTipo === '__global__') { if (hasOrderId(r)) return false; }
    else if (fTipo)             { if (r.txType !== fTipo) return false; }
    // Filtro toolbar: amtType
    if (fAmt && r.amtType !== fAmt) return false;
    // Busca livre
    if (q && !(
      (r.orderId      || '').toLowerCase().includes(q) ||
      (r.sku          || '').toLowerCase().includes(q) ||
      (r.amtDesc      || '').toLowerCase().includes(q) ||
      (r.txType       || '').toLowerCase().includes(q) ||
      (r.settlementId || '').toLowerCase().includes(q)
    )) return false;
    return true;
  });

  // ── Ordenação ─────────────────────────────────
  if (!window.AMZ_SORT) window.AMZ_SORT = { field: '', dir: 1 };
  const srt = window.AMZ_SORT;
  if (srt.field) {
    rows = [...rows].sort((a, b) => {
      let va = a[srt.field] ?? '';
      let vb = b[srt.field] ?? '';
      // Numérico para amount e qty
      if (srt.field === 'amount' || srt.field === 'qty') {
        return (parseFloat(va) - parseFloat(vb)) * srt.dir;
      }
      return String(va).localeCompare(String(vb), 'pt-BR') * srt.dir;
    });
  }

  document.getElementById('amz-cnt').textContent = rows.length + ' linhas';
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / AMZ_PS));
  amzPage = Math.min(amzPage, pages);
  const slice = rows.slice((amzPage-1)*AMZ_PS, amzPage*AMZ_PS);

  // ── Cabeçalhos com sorting ────────────────────
  const thSort = (label, field, cls='') => {
    const active = srt.field === field;
    const icon   = active ? (srt.dir === 1 ? ' ▲' : ' ▼') : '';
    const style  = `cursor:pointer;user-select:none;white-space:nowrap${active ? ';color:#ff9900' : ''}`;
    return `<th class="${cls}" onclick="window.AMZ_SORT={field:'${field}',dir:${active ? -srt.dir : 1}};amzPage=1;buildAmzTable()" style="${style}">${label}${icon}</th>`;
  };

  const thead = document.querySelector('#amz-table thead');
  const tbody = document.querySelector('#amz-table tbody');

  thead.innerHTML = `<tr>
    ${thSort('Pedido','orderId')}
    ${thSort('Data','date')}
    ${thSort('Tipo Transação','txType')}
    ${thSort('Amount Type','amtType')}
    ${thSort('Descrição','amtDesc')}
    ${thSort('SKU','sku')}
    ${thSort('Qtd','qty','tr')}
    ${thSort('Valor','amount','tr')}
    ${thSort('Settlement','settlementId')}
  </tr>`;

  tbody.innerHTML = slice.map(r => {
    let txBadge = '';
    if (r.txType === 'Order')                  txBadge = '<span class="bdg bdg-fat">Order</span>';
    else if (r.txType === 'Refund')            txBadge = '<span class="bdg bdg-can">Refund</span>';
    else if (r.txType === 'Chargeback Refund') txBadge = '<span class="bdg bdg-can">Chargeback</span>';
    else if (r.txType === 'other-transaction') txBadge = '<span class="bdg bdg-pen">Other</span>';
    else if (r.txType)                         txBadge = `<span class="bdg bdg-lib">${r.txType}</span>`;

    const valColor = r.amount > 0 ? 'vpos' : r.amount < 0 ? 'vneg' : '';

    // Coluna pedido: se sem order-id válido → badge GLOBAL, senão order-id normal
    const pedidoCell = hasOrderId(r)
      ? `<td class="mono" style="color:#ff9900">${r.orderId}</td>`
      : `<td><span class="bdg" style="background:rgba(167,139,250,.15);color:#a78bfa;border:1px solid rgba(167,139,250,.3);font-size:10px;letter-spacing:.5px">GLOBAL</span></td>`;

    return `<tr>
      ${pedidoCell}
      <td class="mono">${r.date || '—'}</td>
      <td>${txBadge}</td>
      <td class="mono" style="font-size:10px;color:var(--text-dim)">${r.amtType || '—'}</td>
      <td style="max-width:180px">${r.amtDesc || '—'}</td>
      <td class="mono">${r.sku || '—'}</td>
      <td class="tr mono">${r.qty || '—'}</td>
      <td class="tr mono ${valColor}">${amzFmtSigned(r.amount)}</td>
      <td class="mono" style="font-size:10px;color:var(--text-muted)">${r.settlementId || '—'}</td>
    </tr>`;
  }).join('');

  document.getElementById('amz-pag').innerHTML = `
    <button class="pbtn" ${amzPage<=1?'disabled':''} onclick="amzPage--;buildAmzTable()">‹ Ant</button>
    <span class="pinf">${amzPage} / ${pages} &nbsp;·&nbsp; ${total} linhas</span>
    <button class="pbtn" ${amzPage>=pages?'disabled':''} onclick="amzPage++;buildAmzTable()">Próx ›</button>`;
}
// ─── Tab switch ───────────────────────────────
function amzShowTab(tab) {
  ['settlement','erp','erpv2'].forEach(t => {
    document.getElementById('amz-tab-' + t).classList.toggle('hidden', t !== tab);
    document.getElementById('amz-tab-btn-' + t).classList.toggle('active', t === tab);
  });
  // Atualizar período conforme aba
  if (tab === 'settlement' && AMZ_DATA) {
    const { rows, settlements } = AMZ_DATA;
    const starts = settlements.map(s => s.startDate).filter(Boolean).sort();
    const ends   = settlements.map(s => s.endDate).filter(Boolean).sort();
    const ps = starts[0]           ? starts[0].substring(0,10)           : '';
    const pe = ends.length         ? ends[ends.length-1].substring(0,10) : '';
    document.getElementById('amz-period').textContent =
      ps && pe ? `📅 ${ps} – ${pe} · ${rows.length} linhas` : `${rows.length} linhas`;
  } else if ((tab === 'erp' || tab === 'erpv2') && AMZ_ERP_ORDERS.length) {
    // Período sempre do ERP — não do settlement
    const ps = AMZ_ERP_ORDERS._periodStart || '';
    const pe = AMZ_ERP_ORDERS._periodEnd   || '';
    document.getElementById('amz-period').textContent =
      ps && pe ? `📅 ERP: ${ps} – ${pe} · ${AMZ_ERP_ORDERS.length} pedidos` : `${AMZ_ERP_ORDERS.length} pedidos ERP`;
  }
}


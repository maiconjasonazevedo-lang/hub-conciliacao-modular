/**
 * components/amazon/AmazonErpV2Dashboard.js
 * Estado e renderização da Conciliação Amazon ERP V2 (sobre AMZ_ORDER_MAP).
 * Estado: erpV2Page, AMZ_ERPV2_RESULT, ERPV2_PS.
 * Funções: renderErpV2Tab, buildErpV2Table.
 * Código movido sem alteração de lógica (seção original: AMAZON ERP V2
 * — CONCILIAÇÃO SOBRE AMZ_ORDER_MAP, parte de estado/renderização).
 */

// ══════════════════════════════════════════════
// AMAZON ERP V2 — CONCILIAÇÃO SOBRE AMZ_ORDER_MAP
// NÃO recalcula financeiro. NÃO usa txType/amtType.
// Consome exclusivamente window.AMZ_ORDER_MAP
// construído pela Settlement a partir de amtDesc exato.
// ══════════════════════════════════════════════

let erpV2Page        = 1;
let AMZ_ERPV2_RESULT = [];   // pedidos ERP enriquecidos com dados do AMZ_ORDER_MAP
const ERPV2_PS       = 50;

// ─── Renderizar aba ERP V2 ────────────────────
function renderErpV2Tab() {
  const empty   = document.getElementById('amz-erpv2-empty');
  const content = document.getElementById('amz-erpv2-content');

  const hasErp        = AMZ_ERP_ORDERS.length > 0;
  const hasOrderMap   = window.AMZ_ORDER_MAP && Object.keys(window.AMZ_ORDER_MAP).length > 0;

  if (!hasErp || !hasOrderMap) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  content.classList.remove('hidden');

  // ── Cruzamento ERP × AMZ_ORDER_MAP ───────────
  // Para cada pedido ERP, busca o agregado já classificado pelo Settlement.
  // NÃO chama aggregateEvents. NÃO usa txType/amtType.
  AMZ_ERPV2_RESULT = AMZ_ERP_ORDERS.map(erp => {
    const agg = window.AMZ_ORDER_MAP[erp.orderId] || null;

    // Status simples e previsível:
    // ✅ conciliado    — encontrado no settlement com principalGross > 0
    // 🚫 cancelado     — sem NF emitida E sem settlement (cancelado antes da fatura)
    // ⚠️ sem-settlement — tem NF mas não encontrou no settlement (período ou ID divergente)
    // ❌ divergencia   — encontrado no settlement mas sem venda (principalGross = 0)
    const temNF = !!(erp.notaFiscal && erp.notaFiscal.trim && erp.notaFiscal.trim() !== '' && erp.notaFiscal !== '—');
    let status;
    if (!agg && !temNF)               status = 'cancelado';
    else if (!agg)                    status = 'sem-settlement';
    else if (agg.principalGross > 0)  status = 'conciliado';
    else                              status = 'divergencia';

    return {
      ...erp,
      // ── campos líquidos existentes (NÃO alterar) ──
      principal   : agg ? agg.principal   : 0,
      shipping    : agg ? agg.shipping    : 0,
      commission  : agg ? agg.commission  : 0,
      shippingHB  : agg ? agg.shippingHB  : 0,
      flexFee     : agg ? agg.flexFee     : 0,
      dba         : agg ? agg.dba         : 0,
      safeT       : agg ? agg.safeT       : 0,
      refund      : agg ? agg.refund      : 0,
      refundComm  : agg ? agg.refundComm  : 0,
      chargeback  : agg ? agg.chargeback  : 0,
      outros      : agg ? agg.outros      : 0,
      settlementIds: agg ? agg.settlementIds : '',
      qtdEventos  : agg ? agg.qtdEventos  : 0,
      // ── novos campos Gross / Refund / Net ──
      principalGross   : agg ? agg.principalGross   : 0,
      principalRefund  : agg ? agg.principalRefund  : 0,
      principalNet     : agg ? agg.principalNet     : 0,
      shippingGross    : agg ? agg.shippingGross    : 0,
      shippingRefund   : agg ? agg.shippingRefund   : 0,
      shippingNet      : agg ? agg.shippingNet      : 0,
      commissionGross  : agg ? agg.commissionGross  : 0,
      commissionRefund : agg ? agg.commissionRefund : 0,
      commissionNet    : agg ? agg.commissionNet    : 0,
      shippingHBGross  : agg ? agg.shippingHBGross  : 0,
      shippingHBRefund : agg ? agg.shippingHBRefund : 0,
      shippingHBNet    : agg ? agg.shippingHBNet    : 0,
      flexFeeGross     : agg ? agg.flexFeeGross     : 0,
      flexFeeRefund    : agg ? agg.flexFeeRefund    : 0,
      flexFeeNet       : agg ? agg.flexFeeNet       : 0,
      status,
    };
  });

  // ── Totais para cards ─────────────────────────
  const total        = AMZ_ERPV2_RESULT.length;
  const conciliados  = AMZ_ERPV2_RESULT.filter(r => r.status === 'conciliado').length;
  const cancelados   = AMZ_ERPV2_RESULT.filter(r => r.status === 'cancelado').length;
  const semSettle    = AMZ_ERPV2_RESULT.filter(r => r.status === 'sem-settlement').length;
  const divergentes  = AMZ_ERPV2_RESULT.filter(r => r.status === 'divergencia').length;

  const sum = field => AMZ_ERPV2_RESULT.reduce((s, r) => s + (r[field] || 0), 0);

  // ── Cards usam campos *Net (já consolidam venda + devolução sem dupla contagem) ──
  const vlPrincipal  = sum('principalNet');   // Principal + Refund Principal
  const vlShipping   = sum('shippingNet');    // Shipping líquido
  const vlCommission = sum('commissionNet');  // Commission + Refund Commission
  const vlShipHB     = sum('shippingHBNet');  // ShippingHB líquido
  const vlFlex       = sum('flexFeeNet');     // FlexFee líquido
  const vlDba        = sum('dba');            // DBA — não tem Net separado, já é direto
  const vlSafeT      = sum('safeT');          // SAFE-T — idem
  const vlRefund     = sum('refund');         // mantido para card informativo
  const vlRefComm    = sum('refundComm');     // mantido para card informativo
  const vlChargeback = sum('chargeback');
  const vlOutros     = sum('outros');
  // Total: Net das categorias principais + demais diretos (sem somar refund/refundComm pois já estão embutidos nos Net)
  const vlTotal      = vlPrincipal + vlShipping + vlCommission + vlShipHB + vlFlex + vlDba + vlSafeT + vlChargeback + vlOutros;

  const fml  = v => 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tipHtml = tip => tip
    ? `<i class="tip-icon">?<span class="tip-box">${tip}</span></i>`
    : '';
  const card = (lbl, val, sub, cor, tip='') =>
    `<div class="card" style="border-top:2px solid ${cor}">
      <div class="card-lbl">${lbl}${tipHtml(tip)}</div>
      <div class="card-val" style="color:${cor}">${val}</div>
      <div class="card-sub">${sub}</div>
    </div>`;

  document.getElementById('amz-erpv2-cards').innerHTML =
    // Contagem de pedidos
    card('📦 Pedidos ERP',         total,       `${AMZ_ERP_ORDERS.filter(o => o.secao === 'cancelado').length} cancelados`,                          '#ff9900',
      '<b>Pedidos ERP</b>Total de pedidos importados do ERP (faturados + cancelados). Base para o cruzamento com o settlement Amazon.') +

    card('✅ Conciliados',          conciliados, `${total ? Math.round(conciliados/total*100) : 0}% dos pedidos · principal > 0`,                      'var(--green)',
      '<b>Conciliados</b>Pedidos do ERP que foram encontrados no settlement Amazon com ao menos um evento de venda (Principal Bruto &gt; 0).') +

    (cancelados ? card('🚫 Cancelados',           cancelados,  'sem NF emitida · não entrou no settlement',                                                   '#6b7280',
      '<b>Cancelados</b>Pedidos sem Nota Fiscal emitida e sem registro no settlement. Foram cancelados antes da fatura — comportamento esperado, não requerem ação.') : '') +

    card('⚠️ Sem settlement',       semSettle,   'tem NF · orderId não encontrado no settlement',                                                    '#facc15',
      '<b>Sem Settlement</b>Pedidos com NF emitida cujo Order ID não aparece no settlement. Pode indicar: settlement do período não importado, corte de data ou divergência de ID.') +

    card('❌ Divergência',          divergentes, 'encontrado no settlement sem principal',                                                              'var(--red)',
      '<b>Divergência</b>Pedido encontrado no settlement, mas sem evento de venda (Principal = 0). Pode indicar: somente refund registrado, evento incompleto ou erro de classificação.') +

    // Financeiro — exclusivamente do AMZ_ORDER_MAP
    card('💵 Principal',            fml(vlPrincipal),   'amtDesc=Principal',                                                                           'var(--green)',
      '<b>Principal</b>Valor líquido dos produtos vendidos (venda − devolução).<br><br>Origem: amtDesc = <i>Principal</i><br>Quem paga: Cliente<br>Impacto: receita bruta dos produtos.') +

    card('🚚 Shipping',             fml(vlShipping),    'amtDesc=Shipping',                                                                            'var(--green)',
      '<b>Shipping</b>Frete cobrado do cliente e repassado pelo settlement.<br><br>Origem: amtDesc = <i>Shipping</i><br>Quem paga: Cliente<br>Impacto: aumenta o repasse.') +

    card('💳 Commission',           fml(Math.abs(vlCommission)), 'amtDesc=Commission',                                                                 'var(--red)',
      '<b>Commission</b>Comissão cobrada pela Amazon sobre o valor da venda. Valor sempre negativo no settlement.<br><br>Origem: amtDesc = <i>Commission</i><br>Quem paga: Vendedor<br>Impacto: reduz o repasse.') +

    (vlShipHB    ? card('📦 ShippingHB',      fml(Math.abs(vlShipHB)),    'amtDesc=ShippingHB',                        'var(--red)',
      '<b>ShippingHB / FBA</b>Taxa logística ou fulfillment cobrada pela Amazon (FBA, ShippingHB).<br><br>Origem: amtDesc = <i>ShippingHB</i><br>Quem paga: Vendedor<br>Impacto: reduz o repasse.')    : '') +

    (vlFlex      ? card('📐 Flex Fee',         fml(Math.abs(vlFlex)),      'amtDesc=Flexible Financing Fee',            'var(--red)',
      '<b>Flex Fee</b>Custo financeiro do parcelamento flexível oferecido ao cliente.<br><br>Origem: amtDesc = <i>Flexible Customer Financing fee</i><br>Quem paga: Vendedor<br>Impacto: reduz o repasse.')    : '') +

    (vlDba       ? card('📬 DBA / Easy Ship',  fml(Math.abs(vlDba)),       'amtDesc=Amazon Easy Ship Charges',          '#fb923c',
      '<b>DBA / Easy Ship</b>Custos logísticos do serviço Easy Ship (coleta e entrega pela Amazon).<br><br>Origem: amtDesc = <i>Amazon Easy Ship Charges</i><br>Quem paga: Vendedor<br>Impacto: reduz o repasse.')       : '') +

    (vlSafeT     ? card('🛡️ SAFE-T',           fml(Math.abs(vlSafeT)),     'amtDesc=SAFE-T Claim / SAFE-T reimbursement', '#a78bfa',
      '<b>SAFE-T</b>Reembolso ou ajuste administrativo relacionado ao programa SAFE-T da Amazon (cobertura de disputas e reembolsos protegidos).<br><br>Origem: amtDesc = <i>SAFE-T Claim</i><br>Pode ser positivo (recebimento) ou negativo (débito).')     : '') +

    (vlRefund    ? card('🔁 Refund Principal', fml(Math.abs(vlRefund)),    'amtDesc=Refund Principal',                  '#f87171',
      '<b>Refund Principal</b>Devolução do valor do produto ao cliente. Evento negativo no settlement.<br><br>Origem: amtDesc = <i>Refund Principal</i><br>Quem paga: Vendedor (estorno)<br>Impacto: reduz o repasse.')       : '') +

    (vlRefComm   ? card('🔁 Refund Commission',fml(Math.abs(vlRefComm)),   'amtDesc=Refund Commission / RefundCommission', '#f87171',
      '<b>Refund Commission</b>Comissão devolvida parcialmente em caso de refund. A Amazon pode reter parte como taxa administrativa.<br><br>Origem: amtDesc = <i>RefundCommission</i><br>Impacto: pode compensar parcialmente a perda do refund.')    : '') +

    (vlChargeback? card('⚡ Chargeback',        fml(Math.abs(vlChargeback)),'amtDesc=Chargeback Refund',                 '#f87171',
      '<b>Chargeback</b>Estorno forçado por disputa do cliente junto à operadora de cartão. A Amazon debita o valor do vendedor.<br><br>Origem: amtDesc = <i>Chargeback Refund</i><br>Impacto: reduz o repasse.')       : '') +

    (vlOutros    ? card('📎 Outros',            fml(vlOutros),              'Advertising · Reembolsos · não classificados', '#6b7280',
      '<b>Outros</b>Eventos financeiros não enquadrados nas categorias principais: Advertising, Inventory Reimbursement e demais amtDesc não mapeados.<br><br>Revisar na aba Settlement para ver o detalhe.')   : '') +

    card('🏦 Total Conciliado', fml(vlTotal), `${conciliados} pedidos encontrados no settlement`, 'var(--purple)',
      '<b>Total Conciliado</b>Soma financeira líquida de todos os eventos dos pedidos ERP encontrados no settlement (Principal + Shipping + Commission + demais categorias).<br><br>Representa o valor total a receber/recebido da Amazon para este conjunto de pedidos.');

  erpV2Page = 1;
  buildErpV2Table();
}

// ─── Tabela ERP V2 ────────────────────────────
function buildErpV2Table() {
  if (!AMZ_ERPV2_RESULT.length) return;

  const q       = (document.getElementById('amz-erpv2-q').value || '').toLowerCase();
  const fStatus = document.getElementById('amz-erpv2-f-status').value;

  let rows = AMZ_ERPV2_RESULT.filter(r => {
    if (fStatus && r.status !== fStatus) return false;
    if (q && !(
      (r.orderId     || '').toLowerCase().includes(q) ||
      (r.notaFiscal  || '').toLowerCase().includes(q) ||
      (r.pedidoVenda || '').toLowerCase().includes(q)
    )) return false;
    return true;
  });

  document.getElementById('amz-erpv2-cnt').textContent = rows.length + ' pedidos';

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / ERPV2_PS));
  erpV2Page   = Math.min(erpV2Page, pages);
  const slice = rows.slice((erpV2Page - 1) * ERPV2_PS, erpV2Page * ERPV2_PS);

  const fml  = v => v == null ? '—' : 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmlS = v => v == null ? '—' : (v < 0 ? '-' : '+') + 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const statusLabel = s => ({
    'conciliado'    : '<span class="bdg bdg-lib" style="background:rgba(0,200,100,.15);color:#00c864;border:1px solid #00c86440">✅ Conciliado</span>',
    'cancelado'     : '<span class="bdg" style="background:rgba(107,114,128,.15);color:#9aa3b8;border:1px solid #6b728040">🚫 Cancelado</span>',
    'sem-settlement': '<span class="bdg bdg-pen">⚠️ Sem settlement</span>',
    'divergencia'   : '<span class="bdg bdg-can">❌ Divergência</span>',
  }[s] || s);

  const thead = document.querySelector('#amz-erpv2-table thead');
  const tbody = document.querySelector('#amz-erpv2-table tbody');

  thead.innerHTML = `<tr>
    <th>Status</th>
    <th>Pedido Marketplace</th>
    <th>Ped. Venda</th>
    <th>NF</th>
    <th>Dt Emissão</th>
    <th class="tr" style="border-left:2px solid var(--border2)">Principal</th>
    <th class="tr">Refund Principal</th>
    <th class="tr" style="border-left:2px solid var(--border2)">Shipping</th>
    <th class="tr" style="border-left:2px solid var(--border2)">Commission</th>
    <th class="tr">Refund Comm</th>
    <th class="tr" style="border-left:2px solid var(--border2)">ShippingHB</th>
    <th class="tr" style="border-left:2px solid var(--border2)">Flex Fee</th>
    <th class="tr" style="border-left:2px solid var(--border2)">DBA</th>
    <th class="tr" style="border-left:2px solid var(--border2)">SAFE-T</th>
    <th class="tr" style="border-left:2px solid var(--border2)">Chargeback</th>
    <th class="tr" style="border-left:2px solid var(--border2)">Outros</th>
    <th class="tr" style="border-left:2px solid var(--border2)">Qtd Ev.</th>
    <th>Settlement IDs</th>
  </tr>`;

  const bsl = 'border-left:2px solid var(--border2)';
  const fv = v => v == null || v === 0 ? '<span style="color:var(--text-muted)">—</span>'
    : v > 0
      ? `<span class="vpos">+R$ ${Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`
      : `<span class="vneg">-R$ ${Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`;

  tbody.innerHTML = slice.map(r => `<tr>
    <td>${statusLabel(r.status)}</td>
    <td class="mono" style="color:#ff9900">${r.orderId}</td>
    <td class="mono">${r.pedidoVenda || '—'}</td>
    <td class="mono">${r.notaFiscal  || '—'}</td>
    <td class="mono">${r.dtEmissao   || r.dtPedidoMarketplace || '—'}</td>
    <td class="tr mono" style="${bsl}">${fv(r.principalGross)}</td>
    <td class="tr mono">${fv(r.principalRefund)}</td>
    <td class="tr mono" style="${bsl}">${fv(r.shippingGross)}</td>
    <td class="tr mono" style="${bsl}">${fv(r.commissionGross || r.commissionRefund)}</td>
    <td class="tr mono">${fv(r.refundComm)}</td>
    <td class="tr mono" style="${bsl}">${fv(r.shippingHBGross || r.shippingHBRefund)}</td>
    <td class="tr mono" style="${bsl}">${fv(r.flexFeeGross || r.flexFeeRefund)}</td>
    <td class="tr mono" style="${bsl}">${fv(r.dba)}</td>
    <td class="tr mono" style="${bsl}">${fv(r.safeT)}</td>
    <td class="tr mono" style="${bsl}">${fv(r.chargeback)}</td>
    <td class="tr mono" style="${bsl}">${fv(r.outros)}</td>
    <td class="tr mono" style="${bsl}">${r.qtdEventos || '—'}</td>
    <td class="mono" style="font-size:10px;color:var(--text-dim);max-width:120px;overflow:hidden;text-overflow:ellipsis" title="${r.settlementIds}">${r.settlementIds || '—'}</td>
  </tr>`).join('');

  document.getElementById('amz-erpv2-pag').innerHTML = `
    <button class="pbtn" ${erpV2Page <= 1 ? 'disabled' : ''} onclick="erpV2Page--;buildErpV2Table()">‹ Ant</button>
    <span class="pinf">${erpV2Page} / ${pages} &nbsp;·&nbsp; ${total} pedidos</span>
    <button class="pbtn" ${erpV2Page >= pages ? 'disabled' : ''} onclick="erpV2Page++;buildErpV2Table()">Próx ›</button>`;
}


// ── Exportar ERP V2 → Excel ───────────────────────────────────────────────

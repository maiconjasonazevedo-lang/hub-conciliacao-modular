/**
 * components/amazon/AmazonErpDashboard.js
 * Renderização da aba de conciliação ERP x Settlement Amazon.
 * Funções: renderErpTab, buildErpTable.
 * Depende de: AMZ_ERP_RESULT/erpPage/ERP_PS (services/amazon/amazonErpService.js).
 * Código movido sem alteração de lógica (seção original: AMAZON ERP —
 * PARSER + CRUZAMENTO, parte de renderização).
 */

function renderErpTab() {
  if (!AMZ_ERP_ORDERS.length) {
    document.getElementById('amz-erp-empty').classList.remove('hidden');
    document.getElementById('amz-erp-content').classList.add('hidden');
    return;
  }

  document.getElementById('amz-erp-empty').classList.add('hidden');
  document.getElementById('amz-erp-content').classList.remove('hidden');

  // ── Período vindo exclusivamente do ERP ──────
  const ps = AMZ_ERP_ORDERS._periodStart || '';
  const pe = AMZ_ERP_ORDERS._periodEnd   || '';
  const erpPeriodLabel = ps && pe
    ? `📅 ERP: ${ps} – ${pe} · ${AMZ_ERP_ORDERS.length} pedidos`
    : `📅 ${AMZ_ERP_ORDERS.length} pedidos ERP`;
  // Atualizar period badge do header (reutiliza o mesmo elemento)
  document.getElementById('amz-period').textContent = erpPeriodLabel;

  // ── Contagens de status ──────────────────────
  const total   = AMZ_ERP_RESULT.length;
  const found   = AMZ_ERP_RESULT.filter(r => r.status === 'found').length;
  const partial = AMZ_ERP_RESULT.filter(r => r.status === 'partial').length;
  const missing = AMZ_ERP_RESULT.filter(r => r.status === 'missing').length;
  const cancelados = AMZ_ERP_ORDERS.filter(o => o.secao === 'cancelado').length;

  // ── Totais ERP (lista mestre) ────────────────
  // Apenas pedidos presentes no ERP — nunca eventos globais
  const vlVendaErp  = AMZ_ERP_RESULT.reduce((s,r) => s + r.vlVendaERP,    0);
  const vlCommErp   = AMZ_ERP_RESULT.reduce((s,r) => s + r.vlComissaoERP, 0);

  // ── Totais Settlement filtrados pelo ERP ─────
  // Cada campo vem de aggregateEvents que já separou por amount-type/description
  // principal = Order/ItemPrice/Principal
  const vlPrincipal = AMZ_ERP_RESULT.reduce((s,r) => s + r.principal,  0);
  // shipping = Order/ItemPrice/Shipping
  const vlShipping  = AMZ_ERP_RESULT.reduce((s,r) => s + r.shipping,   0);
  // commission = Order/ItemFees/Commission  (negativo)
  const vlComm      = AMZ_ERP_RESULT.reduce((s,r) => s + r.commission, 0);
  // shippingHB = Order/ItemFees/ShippingHB  (negativo)
  const vlShipHB    = AMZ_ERP_RESULT.reduce((s,r) => s + r.shippingHB, 0);
  // flexFee = Order/ItemFees/Flexible...    (negativo)
  const vlFlex      = AMZ_ERP_RESULT.reduce((s,r) => s + r.flexFee,    0);
  // dba = other-transaction c/ pedido (Easy Ship charges)
  const vlDba       = AMZ_ERP_RESULT.reduce((s,r) => s + r.dba,        0);
  // safeT = other-transaction safe-t c/ pedido
  const vlSafeT     = AMZ_ERP_RESULT.reduce((s,r) => s + r.safeT,      0);
  // refund = Refund/Principal
  const vlRefund    = AMZ_ERP_RESULT.reduce((s,r) => s + r.refund,     0);
  // refundComm = Refund/Commission
  const vlRefComm   = AMZ_ERP_RESULT.reduce((s,r) => s + r.refundComm, 0);
  // chargeback = Chargeback Refund
  const vlChargebk  = AMZ_ERP_RESULT.reduce((s,r) => s + r.chargeback, 0);

  const fml  = v => 'R$ ' + Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmlD = (v, ref) => {
    const d = v - ref;
    return (d >= 0 ? '+' : '-') + 'R$ ' + Math.abs(d).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  };

  document.getElementById('amz-erp-cards').innerHTML = `
    <div class="card" style="border-top:2px solid #ff9900">
      <div class="card-lbl">📦 Pedidos ERP</div>
      <div class="card-val" style="color:#ff9900">${total}</div>
      <div class="card-sub">${cancelados} cancelados · ${total - cancelados} faturados</div>
    </div>
    <div class="card green">
      <div class="card-lbl">✅ Encontrados</div>
      <div class="card-val">${found}</div>
      <div class="card-sub">${total ? Math.round(found/total*100) : 0}% dos pedidos</div>
    </div>
    <div class="card yellow">
      <div class="card-lbl">⚠️ Parciais</div>
      <div class="card-val">${partial}</div>
      <div class="card-sub">Sem commission ou principal</div>
    </div>
    <div class="card red">
      <div class="card-lbl">❌ Sem Settlement</div>
      <div class="card-val">${missing}</div>
      <div class="card-sub">Nenhum evento encontrado</div>
    </div>
    <div class="card green">
      <div class="card-lbl">💰 Venda ERP</div>
      <div class="card-val">${fml(vlVendaErp)}</div>
      <div class="card-sub">Comissão ERP: ${fml(vlCommErp)}</div>
    </div>
    <div class="card blue">
      <div class="card-lbl">💵 Principal Settlement</div>
      <div class="card-val">${fml(vlPrincipal)}</div>
      <div class="card-sub">Diff vs ERP: ${fmlD(vlPrincipal, vlVendaErp)}</div>
    </div>
    <div class="card" style="border-top:2px solid var(--green)">
      <div class="card-lbl">🚚 Shipping Settlement</div>
      <div class="card-val" style="color:var(--green)">${fml(vlShipping)}</div>
      <div class="card-sub">Frete recebido pelo pedido</div>
    </div>
    <div class="card red">
      <div class="card-lbl">💳 Commission Settlement</div>
      <div class="card-val">${fml(Math.abs(vlComm))}</div>
      <div class="card-sub">Diff vs ERP: ${fmlD(Math.abs(vlComm), vlCommErp)}</div>
    </div>
    ${vlShipHB ? `<div class="card red">
      <div class="card-lbl">📦 ShippingHB</div>
      <div class="card-val">${fml(Math.abs(vlShipHB))}</div>
      <div class="card-sub">ItemFees/ShippingHB</div>
    </div>` : ''}
    ${vlFlex ? `<div class="card red">
      <div class="card-lbl">📐 Flex Fee</div>
      <div class="card-val">${fml(Math.abs(vlFlex))}</div>
      <div class="card-sub">Flexible Financing Fee</div>
    </div>` : ''}
    ${vlDba ? `<div class="card yellow">
      <div class="card-lbl">📬 DBA / Easy Ship</div>
      <div class="card-val">${fml(Math.abs(vlDba))}</div>
      <div class="card-sub">other-transaction c/ pedido</div>
    </div>` : ''}
    ${vlSafeT ? `<div class="card" style="border-top:2px solid #a78bfa">
      <div class="card-lbl">🛡️ SAFE-T c/ pedido</div>
      <div class="card-val" style="color:#a78bfa">${fml(Math.abs(vlSafeT))}</div>
      <div class="card-sub">SAFE-T Claim vinculado</div>
    </div>` : ''}
    ${vlRefund || vlRefComm || vlChargebk ? `<div class="card orange">
      <div class="card-lbl">🔁 Refund Principal</div>
      <div class="card-val">${fml(Math.abs(vlRefund))}</div>
      <div class="card-sub">Comm devolvida: ${fml(Math.abs(vlRefComm))} · Chargeback: ${fml(Math.abs(vlChargebk))}</div>
    </div>` : ''}`;

  erpPage = 1;
  buildErpTable();
}

// ─── Tabela ERP ───────────────────────────────
function buildErpTable() {
  if (!AMZ_ERP_RESULT.length) return;

  const q       = (document.getElementById('amz-erp-q').value || '').toLowerCase();
  const fStatus = document.getElementById('amz-erp-f-status').value;

  let rows = AMZ_ERP_RESULT.filter(r => {
    if (fStatus && r.status !== fStatus) return false;
    if (q && !(
      (r.orderId     || '').toLowerCase().includes(q) ||
      (r.notaFiscal  || '').toLowerCase().includes(q) ||
      (r.pedidoVenda || '').toLowerCase().includes(q)
    )) return false;
    return true;
  });

  document.getElementById('amz-erp-cnt').textContent = rows.length + ' pedidos';
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / ERP_PS));
  erpPage = Math.min(erpPage, pages);
  const slice = rows.slice((erpPage-1)*ERP_PS, erpPage*ERP_PS);

  const fml  = v => v ? 'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—';
  const fmlS = v => v === 0 ? '—' : (v<0?'-':'')+'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

  const statusLabel = s => ({
    found  : '<span class="bdg bdg-lib" style="background:rgba(0,200,100,.15);color:#00c864;border:1px solid #00c86440">✅ Encontrado</span>',
    partial: '<span class="bdg bdg-pen">⚠️ Parcial</span>',
    missing: '<span class="bdg bdg-can">❌ Sem Settlement</span>',
  }[s] || s);

  const thead = document.querySelector('#amz-erp-table thead');
  const tbody = document.querySelector('#amz-erp-table tbody');

  thead.innerHTML = `<tr>
    <th>Status</th>
    <th>Pedido Marketplace</th>
    <th>Ped. Venda</th>
    <th>NF</th>
    <th>Dt Emissão</th>
    <th class="tr">Venda ERP</th>
    <th class="tr">Comissão ERP</th>
    <th class="tr">Principal</th>
    <th class="tr">Commission</th>
    <th class="tr">ShippingHB</th>
    <th class="tr">DBA/Easy Ship</th>
    <th class="tr">Refund</th>
    <th class="tr">Qtd Ev.</th>
    <th>Settlement(s)</th>
  </tr>`;

  tbody.innerHTML = slice.map(r => {
    const refundTotal = r.refund + r.chargeback;
    return `<tr>
      <td>${statusLabel(r.status)}</td>
      <td class="mono" style="color:#ff9900">${r.orderId}</td>
      <td class="mono">${r.pedidoVenda || '—'}</td>
      <td class="mono">${r.notaFiscal  || '—'}</td>
      <td class="mono">${r.dtEmissao   || r.dtPedidoMarketplace || '—'}</td>
      <td class="tr mono vpos">${fml(r.vlVendaERP)}</td>
      <td class="tr mono vneg">${fml(r.vlComissaoERP)}</td>
      <td class="tr mono ${r.principal>0?'vpos':''}">${fmlS(r.principal)}</td>
      <td class="tr mono ${r.commission<0?'vneg':''}">${fmlS(r.commission)}</td>
      <td class="tr mono">${fmlS(r.shippingHB)}</td>
      <td class="tr mono">${fmlS(r.dba)}</td>
      <td class="tr mono ${refundTotal!==0?'vneg':''}">${fmlS(refundTotal)}</td>
      <td class="tr mono">${r.qtdEventos || '—'}</td>
      <td class="mono" style="font-size:10px;color:var(--text-dim);max-width:120px;overflow:hidden;text-overflow:ellipsis" title="${r.settlementIds}">${r.settlementIds || '—'}</td>
    </tr>`;
  }).join('');

  document.getElementById('amz-erp-pag').innerHTML = `
    <button class="pbtn" ${erpPage<=1?'disabled':''} onclick="erpPage--;buildErpTable()">‹ Ant</button>
    <span class="pinf">${erpPage} / ${pages} &nbsp;·&nbsp; ${total} pedidos</span>
    <button class="pbtn" ${erpPage>=pages?'disabled':''} onclick="erpPage++;buildErpTable()">Próx ›</button>`;
}


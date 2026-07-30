/**
 * components/shopeeNF/ShopeeNFDashboard.js
 * Renderização do resultado e da tabela de pedidos da Conciliação NF
 * Shopee.
 * Funções: snfShowResult, snfBuildTable, snfGoPage.
 * Depende de: SNF, SNF_ROWS, snfPage, SNF_PER_PAGE
 * (services/shopeeNF/shopeeNFStorage.js), snfFmt (idem).
 * Código movido sem alteração de lógica (seções originais: SHOPEE
 * CONCILIAÇÃO NF — renderização resultado / tabela de pedidos).
 */

// ══════════════════════════════════════════════
// SHOPEE CONCILIAÇÃO NF — renderização resultado
// ══════════════════════════════════════════════
function snfShowResult() {
  const S = SNF;
  const TOL = 0.05; // tolerância de R$ 0,05 por arredondamento

  function diffStatus(nf, ord) {
    const d = Math.abs(nf - ord);
    if (d <= TOL) return {icon:'✅', cls:'green', label:'OK'};
    if (d <= 1.0) return {icon:'⚠️', cls:'yellow', label:'Dif. pequena'};
    return {icon:'❌', cls:'red', label:'Divergência'};
  }

  // Cards
  document.getElementById('snf-cards').innerHTML = `
    <div class="card blue">
      <div class="card-lbl">Pedidos Faturados</div>
      <div class="card-val">${S.faturados}</div>
      <div class="card-sub">${S.cancelados} cancelados excluídos</div>
    </div>
    <div class="card yellow">
      <div class="card-lbl">Com Devolução</div>
      <div class="card-val">${S.devolvidos}</div>
      <div class="card-sub">Gerando abatimentos na NF</div>
    </div>
    <div class="card orange">
      <div class="card-lbl">Comissão Líq. Orders</div>
      <div class="card-val">R$ ${snfFmt(S.ordComissao + S.ordServico)}</div>
      <div class="card-sub">comissão + serviço</div>
    </div>
    <div class="card green">
      <div class="card-lbl">Processamento Orders</div>
      <div class="card-val">R$ ${snfFmt(S.ordTransacao)}</div>
      <div class="card-sub">taxa de transação</div>
    </div>`;

  // Tabela comparativa
  const rows = [
    // Grupo Comissão
    { grupo:'Comissão', item:'Serv. de comissão',          nf: S.nfComissao,       ord: S.ordComissao,      abat:false },
    { grupo:'Comissão', item:'Taxa por item vendido',       nf: S.nfTaxaItem,       ord: S.ordServico,       abat:false },
    { grupo:'Comissão', item:'(-) Abat. devoluções',        nf:-S.nfAbatComissao,   ord:-S.ordAbatComissao,  abat:true  },
    { grupo:'Comissão', item:'TOTAL COMISSÃO',              nf: S.nfTotalComissao,  ord: S.ordTotalComissao, total:true },
    // Grupo Opcionais (sem coluna Orders — comparar com zero)
    { grupo:'Opcionais', item:'(-) Abat. devol. opcionais', nf:-S.nfAbatOpcionais,  ord:0,                   abat:true, info:true },
    // Grupo Processamento
    { grupo:'Processamento', item:'Serv. de processamento', nf: S.nfProcessamento,  ord: S.ordTransacao,     abat:false },
    { grupo:'Processamento', item:'(-) Abat. devoluções',   nf:-S.nfAbatProc,       ord:-S.ordAbatProc,      abat:true  },
    { grupo:'Processamento', item:'TOTAL PROCESSAMENTO',    nf: S.nfTotalProc,      ord: S.ordTotalProc,     total:true },
  ];

  let lastGrupo = '';
  const tbody = document.getElementById('snf-compare-body');
  tbody.innerHTML = '';
  rows.forEach(row => {
    const diff = row.nf - row.ord;
    const st   = row.info ? {icon:'ℹ️', cls:'', label:'Sem coluna Orders'} : diffStatus(row.nf, row.ord);
    const tr   = document.createElement('tr');
    if (row.total) tr.style.cssText = 'font-weight:700;border-top:1px solid var(--border2)';

    const grupoCell = row.grupo !== lastGrupo
      ? `<td style="font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--text-dim);padding-top:${lastGrupo?'14px':'4px'}">${row.grupo}</td>`
      : `<td></td>`;
    lastGrupo = row.grupo;

    tr.innerHTML = `
      ${grupoCell}
      <td style="padding-left:12px">${row.item}</td>
      <td style="text-align:right;color:${row.nf<0?'var(--red)':'var(--text)'}">${snfFmt(row.nf)}</td>
      <td style="text-align:right;color:${row.ord<0?'var(--red)':'var(--text)'}">${row.info?'—':snfFmt(row.ord)}</td>
      <td style="text-align:right;color:${Math.abs(diff)>TOL?'var(--red)':'var(--text-dim)'}">${row.info?'—':(diff>=0?'+':'')+snfFmt(diff)}</td>
      <td style="text-align:center"><span class="badge ${st.cls}">${st.icon} ${st.label}</span></td>`;
    tbody.appendChild(tr);
  });

  // Período
  document.getElementById('snf-period').textContent = `📅 ${S.periodo} · ${S.faturados} pedidos faturados`;

  // Renderiza tabela de pedidos
  snfPage = 1;
  snfBuildTable();

  // Transição de tela
  document.getElementById('snf-upload-screen').style.display = 'none';
  document.getElementById('snf-result-screen').style.display = 'block';
}

// ══════════════════════════════════════════════
// SHOPEE CONCILIAÇÃO NF — tabela de pedidos
// ══════════════════════════════════════════════
function snfBuildTable() {
  if (!SNF) return;
  const q   = (document.getElementById('snf-q').value||'').toLowerCase();
  const fst = document.getElementById('snf-f-status').value;

  let rows = SNF.rows;
  if (q)   rows = rows.filter(r => r.pedido.toLowerCase().includes(q) || r.produto.toLowerCase().includes(q));
  if (fst === 'faturado')  rows = rows.filter(r => !r.cancelado);
  if (fst === 'devolvido') rows = rows.filter(r => r.devolvido);
  if (fst === 'cancelado') rows = rows.filter(r => r.cancelado);

  document.getElementById('snf-cnt').textContent = `${rows.length} pedidos`;

  const totalPages = Math.max(1, Math.ceil(rows.length / SNF_PER_PAGE));
  snfPage = Math.min(snfPage, totalPages);
  const slice = rows.slice((snfPage-1)*SNF_PER_PAGE, snfPage*SNF_PER_PAGE);

  const thead = document.querySelector('#snf-table thead');
  const tbody = document.querySelector('#snf-table tbody');
  thead.innerHTML = `<tr>
    <th>ID Pedido</th><th>Data</th><th>Status</th><th>Dev/Reemb</th>
    <th style="text-align:right">Vl Total</th>
    <th style="text-align:right">Comissão Liq</th>
    <th style="text-align:right">Serviço Liq</th>
    <th style="text-align:right">Transação</th>
    <th style="text-align:right">Total Comissão</th>
    <th style="text-align:right">Total Proc</th>
    <th>Produto</th>
  </tr>`;
  tbody.innerHTML = slice.map(r => `<tr class="${r.cancelado?'row-cancel':r.devolvido?'row-dev':''}">
    <td style="font-family:monospace;font-size:11px">${r.pedido}</td>
    <td style="font-size:11px">${r.data.slice(0,10)}</td>
    <td><span class="badge ${r.cancelado?'red':r.devolvido?'yellow':'green'}" style="font-size:9px">${r.status.slice(0,22)}</span></td>
    <td style="font-size:10px;color:var(--text-dim)">${r.statusDev||'—'}</td>
    <td style="text-align:right">${snfFmt(r.valorTotal)}</td>
    <td style="text-align:right">${snfFmt(r.comissaoLiq)}</td>
    <td style="text-align:right">${snfFmt(r.servicoLiq)}</td>
    <td style="text-align:right">${snfFmt(r.transacao)}</td>
    <td style="text-align:right;font-weight:600">${snfFmt(r.totalComissao)}</td>
    <td style="text-align:right;font-weight:600">${snfFmt(r.totalProc)}</td>
    <td style="font-size:11px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.produto}</td>
  </tr>`).join('');

  // Paginação
  const pag = document.getElementById('snf-pag');
  if (totalPages <= 1) { pag.innerHTML=''; return; }
  let h = '';
  for (let i=1; i<=totalPages; i++) {
    h += `<button class="pg-btn${i===snfPage?' active':''}" onclick="snfGoPage(${i})">${i}</button>`;
  }
  pag.innerHTML = h;
}

function snfGoPage(p) { snfPage=p; snfBuildTable(); }


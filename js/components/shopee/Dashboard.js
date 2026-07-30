/**
 * components/shopee/Dashboard.js
 * Renderização das telas do app Shopee: dashboard, transações,
 * biblioteca, saques, NFs, filtros e paginação.
 * Funções: showApp, showTab, buildDash, getTrFilt, buildTrans, getLbFilt,
 * buildLib, buildSaques, getNF2Filt, buildNF2, renderPag, initFilters.
 * Depende de: f/fBR/fBRsigned/fn2/pct/bst/bsq/PS (services/shopee/formatters.js),
 * openDrw (components/shopee/Drawer.js).
 * Código movido sem alteração de lógica (restante da seção original DISPLAY).
 */

function showApp(period) {
  document.getElementById('upload-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
  document.getElementById('hdr-period').textContent = '📅 ' + period;
  initFilters(); buildDash(); buildTrans(); buildLib(); buildSaques(); buildNF2();
  showTab('dash');
}

function showTab(t) {
  ['dash','trans','lib','saques','nfs'].forEach(n => document.getElementById('tab-'+n).classList.toggle('hidden',n!==t));
  document.querySelectorAll('.tab').forEach((el,i) => el.classList.toggle('active',['dash','trans','lib','saques','nfs'][i]===t));
}

// DASHBOARD
function buildDash() {
  const rel = D.released, cur = D.current, sqs = D.saques;
  const fat = cur.filter(r=>['Faturado','Enviado','Pago'].includes(r.status));
  const tv = fat.reduce((s,r)=>s+fn2(r.totalPedido),0);
  const tt = fat.reduce((s,r)=>s+fn2(r.totalTaxas),0);
  const tLib = rel.reduce((s,r)=>s+Math.abs(fn2(r.valor)),0);
  const tSaq = sqs.reduce((s,r)=>s+r.valor,0);
  const can = cur.filter(r=>r.status==='Cancelado');

  document.getElementById('dash-cards').innerHTML = `
    <div class="card orange"><div class="card-lbl">Vendas Faturadas</div><div class="card-val">${f(tv)}</div><div class="card-sub">${fat.length} pedidos</div></div>
    <div class="card red"><div class="card-lbl">Total Taxas</div><div class="card-val">${f(tt)}</div><div class="card-sub">${pct(tt,tv)} das vendas</div></div>
    <div class="card green"><div class="card-lbl">Receita Líquida</div><div class="card-val">${f(tv-tt)}</div><div class="card-sub">após taxas</div></div>
    <div class="card blue"><div class="card-lbl">Liberações</div><div class="card-val">${f(tLib)}</div><div class="card-sub">${rel.length} pedidos</div></div>
    <div class="card yellow"><div class="card-lbl">Saques</div><div class="card-val">${f(tSaq)}</div><div class="card-sub">${sqs.length} saques</div></div>
    <div class="card"><div class="card-lbl">Cancelados</div><div class="card-val" style="color:var(--red)">${can.length}</div><div class="card-sub">de ${cur.length}</div></div>`;

  document.getElementById('dash-saques').innerHTML = sqs.length ? sqs.map(sq=>{
    const ords = D.released.filter(r=>r.saque===sq.label);
    const tb = ords.reduce((a,r)=>a+Math.abs(fn2(r.valor)),0);
    const ttx = ords.reduce((a,r)=>a+fn2(r.totalTaxas),0);
    return `<div class="sc"><div class="sc-hd"><div class="sc-t">📤 ${sq.data}</div><div class="sc-v">${f(sq.valor)}</div></div>
      <div class="sc-bd">
        <div class="srow"><span>Pedidos</span><span>${ords.length}</span></div>
        <div class="srow"><span>Bruto</span><span>${f(tb)}</span></div>
        <div class="srow"><span>Taxas</span><span style="color:var(--red)">${f(ttx)}</span></div>
      </div></div>`;
  }).join('') : '<p style="color:var(--text-muted);font-size:12px">Nenhum saque no período.</p>';

  const rth=document.querySelector('#t-rec thead'), rtb=document.querySelector('#t-rec tbody');
  rth.innerHTML = `<tr><th>Data</th><th>Tipo</th><th>Pedido</th><th class="tr">Valor</th><th class="tr">Tarifa</th><th>NF</th><th>Saque</th></tr>`;
  rtb.innerHTML = D.transList.slice(0,12).map(t=>`<tr onclick='openDrw(${JSON.stringify(t).replace(/'/g,"&#39;")},"tr")'>
    <td class="mono" style="color:var(--text-dim);font-size:10.5px">${fmtDateBR(parseDate(t.data))}</td>
    <td style="max-width:160px" title="${t.pagamento}">${t.tipo==='Renda do pedido'?'Renda':'<span style="color:var(--text-dim)">'+t.tipo+'</span>'}</td>
    <td class="mono vora">${t.pedido}</td>
    <td class="mono tr ${fn2(t.valor)>=0?'vpos':'vneg'}">${f(t.valor)}</td>
    <td class="mono tr">${t.tarifa!=null?f(t.tarifa):'–'}</td>
    <td>${t.nf?`<span class="nfv">${t.nf}</span>`:'<span class="nfe">–</span>'}</td>
    <td>${t.saque?bsq(t.saque):''}</td>
  </tr>`).join('');
}

// TRANSAÇÕES
function getTrFilt() {
  const q=document.getElementById('ft-q').value.toLowerCase();
  const tp=document.getElementById('ft-tp').value;
  const sq=document.getElementById('ft-sq').value;
  return D.transList.filter(t=>
    (!q||t.pedido.toLowerCase().includes(q)||t.tipo.toLowerCase().includes(q)||t.pagamento.toLowerCase().includes(q))&&
    (!tp||t.tipo===tp)&&(!sq||t.saque===sq));
}
function buildTrans() {
  const data=getTrFilt();
  document.getElementById('cnt-tr').textContent=data.length+' linhas';
  const page=data.slice((pages.tr-1)*PS,pages.tr*PS);
  const th=document.querySelector('#t-tr thead'), tb=document.querySelector('#t-tr tbody');
  if(!th.innerHTML) th.innerHTML=`<tr><th>Data</th><th>Tipo / Pagamento</th><th>Pedido</th><th>Direção</th><th class="tr">Valor</th><th class="tr">Saldo</th><th class="tr">Tarifa</th><th class="tr">V.Mercadoria</th><th class="tr">Frete Comp.</th><th class="tr">Frete Shopee</th><th>NF</th><th>Saque</th></tr>`;
  tb.innerHTML=page.length?page.map(t=>`<tr onclick='openDrw(${JSON.stringify(t).replace(/'/g,"&#39;")},"tr")'>
    <td class="mono" style="color:var(--text-dim);font-size:10.5px">${fmtDateBR(parseDate(t.data))}</td>
    <td style="max-width:170px;overflow:hidden;text-overflow:ellipsis" title="${t.pagamento}">${t.pagamento}</td>
    <td class="mono vora">${t.pedido}</td>
    <td><span class="bdg ${fn2(t.valor)>=0?'bdg-fat':'bdg-can'}">${t.status}</span>${t.semDados?'<span class="bdg" style="background:rgba(241,196,15,.15);color:var(--yellow);margin-left:4px">sem dados</span>':''}</td>
    <td class="mono tr ${fn2(t.valor)>=0?'vpos':'vneg'}">${f(t.valor)}</td>
    <td class="mono tr" style="color:var(--text-dim)">${f(t.saldo)}</td>
    <td class="mono tr">${t.tarifa!=null?f(t.tarifa):'–'}</td>
    <td class="mono tr">${t.valorMercadoria!=null?f(t.valorMercadoria):'–'}</td>
    <td class="mono tr">${t.taxaEnvio!=null?f(t.taxaEnvio):'–'}</td>
    <td class="mono tr vpos">${(t.freteDesconto!=null&&fn2(t.freteDesconto)>0)?f(t.freteDesconto):'–'}</td>
    <td>${t.nf?`<span class="nfv">${t.nf}</span>`:'<span class="nfe">–</span>'}</td>
    <td>${t.saque?bsq(t.saque):''}</td>
  </tr>`).join(''):'<tr><td colspan="12" style="text-align:center;padding:30px;color:var(--text-muted)">Nenhuma transação</td></tr>';
  renderPag('pag-tr',pages.tr,data.length,p=>{pages.tr=p;buildTrans();});
}

// LIBERAÇÕES
function getLbFilt() {
  const q=document.getElementById('fl-q').value.toLowerCase();
  const sq=document.getElementById('fl-sq').value;
  return D.released.filter(r=>(!q||r.pedido.toLowerCase().includes(q)||r.produto.toLowerCase().includes(q))&&(!sq||r.saque===sq));
}
function buildLib() {
  const data=getLbFilt();
  document.getElementById('cnt-lb').textContent=data.length+' pedidos';
  const page=data.slice((pages.lb-1)*PS,pages.lb*PS);
  const th=document.querySelector('#t-lb thead'),tb=document.querySelector('#t-lb tbody');
  if(!th.innerHTML) th.innerHTML=`<tr><th>Pedido</th><th>Data</th><th>Produto</th><th class="tr">Preço</th><th class="tr">Frete Shopee</th><th class="tr">Com.Bruta</th><th class="tr">Ajuste AC</th><th class="tr">Com.Líq.</th><th class="tr">Tx.Trans.</th><th class="tr">Liberado</th><th>NF</th><th>Saque</th></tr>`;
  tb.innerHTML=page.length?page.map(t=>`<tr onclick='openDrw(${JSON.stringify(t).replace(/'/g,"&#39;")},"lib")'>
    <td class="mono vblu">${t.pedido}</td>
    <td class="mono" style="color:var(--text-dim);font-size:10.5px">${fmtDateBR(parseDate(t.data))}</td>
    <td title="${t.produto}">${t.produto}</td>
    <td class="mono tr">${f(t.valorMercadoria)}</td>
    <td class="mono tr vpos">${fn2(t.freteDesconto)>0?f(t.freteDesconto):'–'}</td>
    <td class="mono tr vneg">${t.cb?f(t.cb):'–'}</td>
    <td class="mono tr vpur">${fn2(t.ajAC)>0?'+'+f(t.ajAC):'–'}</td>
    <td class="mono tr vneg">${f(t.cl)}</td>
    <td class="mono tr vneg">${fn2(t.txTrans)?f(t.txTrans):'–'}</td>
    <td class="mono tr vpos">${f(t.valor)}</td>
    <td>${t.nf?`<span class="nfv">${t.nf}</span>`:'<span class="nfe">–</span>'}</td>
    <td>${bsq(t.saque)}</td>
  </tr>`).join(''):'<tr><td colspan="12" style="text-align:center;padding:30px;color:var(--text-muted)">Nenhum</td></tr>';
  renderPag('pag-lb',pages.lb,data.length,p=>{pages.lb=p;buildLib();});
}

// SAQUES DETAIL
function buildSaques() {
  let html='';
  if(!D.saques.length){html='<p style="color:var(--text-muted);font-size:12px;padding:16px 0">Nenhum saque identificado.</p>';}
  else D.saques.forEach(sq=>{
    const ords=D.released.filter(r=>r.saque===sq.label);
    const tb=ords.reduce((a,r)=>a+Math.abs(fn2(r.valor)),0);
    const ttx=ords.reduce((a,r)=>a+fn2(r.totalTaxas),0);
    html+=`<div style="margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="font-family:var(--fh);font-size:15px;font-weight:800;color:var(--orange)">📤 Saque ${sq.data}</div>
        <div style="font-family:var(--fm);font-size:17px">${f(sq.valor)}</div>
      </div>
      <div class="cards" style="grid-template-columns:repeat(4,1fr);margin-bottom:10px">
        <div class="card green"><div class="card-lbl">Pedidos</div><div class="card-val">${ords.length}</div></div>
        <div class="card orange"><div class="card-lbl">Bruto</div><div class="card-val">${f(tb)}</div></div>
        <div class="card red"><div class="card-lbl">Taxas</div><div class="card-val">${f(ttx)}</div></div>
        <div class="card blue"><div class="card-lbl">Líquido</div><div class="card-val">${f(tb-ttx)}</div></div>
      </div>
      <div class="tw"><div class="ts"><table>
        <thead><tr><th>Pedido</th><th>Data</th><th>Produto</th><th class="tr">Liberado</th><th class="tr">Tarifa</th><th class="tr">Frete Shopee</th><th>NF</th><th>Pagamento</th></tr></thead>
        <tbody>${ords.map(t=>`<tr onclick='openDrw(${JSON.stringify(t).replace(/'/g,"&#39;")},"lib")'>
          <td class="mono vblu">${t.pedido}</td>
          <td class="mono" style="color:var(--text-dim);font-size:10.5px">${fmtDateBR(parseDate(t.data))}</td>
          <td title="${t.produto}">${t.produto}</td>
          <td class="mono tr vpos">${f(t.valor)}</td>
          <td class="mono tr vneg">${f(t.tarifa)}</td>
          <td class="mono tr vpos">${fn2(t.freteDesconto)>0?f(t.freteDesconto):'–'}</td>
          <td>${t.nf?`<span class="nfv">${t.nf}</span>`:'<span class="nfe">–</span>'}</td>
          <td style="color:var(--text-dim);font-size:10.5px">${t.pagamento||'–'}</td>
        </tr>`).join('')||'<tr><td colspan="8" style="text-align:center;padding:16px;color:var(--text-muted)">Nenhum pedido neste saque</td></tr>'}
        </tbody>
      </table></div></div>
    </div>`;
  });
  document.getElementById('saq-det').innerHTML=html;
}

// NFs
function getNF2Filt(){
  const q=document.getElementById('fn-q').value.toLowerCase();
  const st=document.getElementById('fn-st2').value;
  // Mostrar current (pedidos novos com NF do anymarket) + released (pedidos antigos)
  const all=[
    ...D.current.map(r=>({...r,_src:'cur'})),
    ...D.released.map(t=>({pedido:t.pedido,status:'Liberado',produto:t.produto,totalPedido:Math.abs(t.valor),nf:t.nf,dataNF:'',dataPedido:fmtDateBR(parseDate(t.data),'date'),_src:'lib'}))
  ];
  return all.filter(r=>{
    const h=!!r.nf;
    return (!q||r.pedido.toLowerCase().includes(q)||r.produto.toLowerCase().includes(q)||(r.nf||'').includes(q))&&
      (!st||(st==='com'&&h)||(st==='sem'&&!h));
  });
}
function buildNF2(){
  const data=getNF2Filt();
  document.getElementById('cnt-nf2').textContent=data.length+' pedidos';
  const page=data.slice((pages.nf2-1)*PS,pages.nf2*PS);
  const th=document.querySelector('#t-nf2 thead'),tb=document.querySelector('#t-nf2 tbody');
  if(!th.innerHTML) th.innerHTML=`<tr><th>Pedido</th><th>Status</th><th>Produto</th><th class="tr">Valor</th><th>Nº NF</th><th>Data NF</th><th>Data Pedido</th></tr>`;
  tb.innerHTML=page.length?page.map(r=>`<tr>
    <td class="mono ${r._src==='lib'?'vblu':'vora'}">${r.pedido}</td>
    <td>${bst(r.status)}</td>
    <td title="${r.produto||''}">${r.produto||'–'}</td>
    <td class="mono tr">${f(r.totalPedido)}</td>
    <td>${r.nf?`<span class="nfv">📄 ${r.nf}</span>`:'<span class="nfe">Sem NF</span>'}</td>
    <td class="mono" style="color:var(--text-dim)">${r.dataNF||'–'}</td>
    <td class="mono" style="color:var(--text-dim)">${r.dataPedido||'–'}</td>
  </tr>`).join(''):'<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Nenhum pedido</td></tr>';
  renderPag('pag-nf2',pages.nf2,data.length,p=>{pages.nf2=p;buildNF2();});
}

// PAGINATION
function renderPag(id,page,total,cb){
  const pg=Math.ceil(total/PS)||1;
  document.getElementById(id).innerHTML=`
    <span class="pinf">${Math.min((page-1)*PS+1,total)}–${Math.min(page*PS,total)} de ${total}</span>
    <button class="pbtn" ${page<=1?'disabled':''} onclick="(${cb.toString()})(${page-1})">‹</button>
    <span class="pinf">${page}/${pg}</span>
    <button class="pbtn" ${page>=pg?'disabled':''} onclick="(${cb.toString()})(${page+1})">›</button>`;
}

// INIT FILTERS
function initFilters(){
  pages={tr:1,lb:1,nf2:1};
  ['#t-tr thead','#t-lb thead','#t-nf2 thead'].forEach(s=>{document.querySelector(s).innerHTML='';});

  const tpSel=document.getElementById('ft-tp');
  tpSel.innerHTML='<option value="">Todos os Tipos</option>';
  [...new Set(D.transList.map(t=>t.tipo))].forEach(tp=>{const o=document.createElement('option');o.textContent=tp;tpSel.appendChild(o);});

  const sqTr=document.getElementById('ft-sq');
  sqTr.innerHTML='<option value="">Todos os Saques</option>';
  [...new Set(D.transList.map(t=>t.saque).filter(Boolean))].forEach(sq=>{const o=document.createElement('option');o.textContent=sq;sqTr.appendChild(o);});

  const sqLb=document.getElementById('fl-sq');
  sqLb.innerHTML='<option value="">Todos os Saques</option>';
  [...new Set(D.released.map(t=>t.saque).filter(Boolean))].forEach(sq=>{const o=document.createElement('option');o.textContent=sq;sqLb.appendChild(o);});

  ['ft-q','ft-tp','ft-sq'].forEach(id=>{document.getElementById(id).addEventListener('input',()=>{pages.tr=1;buildTrans();});document.getElementById(id).addEventListener('change',()=>{pages.tr=1;buildTrans();});});
  ['fl-q','fl-sq'].forEach(id=>{document.getElementById(id).addEventListener('input',()=>{pages.lb=1;buildLib();});document.getElementById(id).addEventListener('change',()=>{pages.lb=1;buildLib();});});
  ['fn-q','fn-st2'].forEach(id=>{document.getElementById(id).addEventListener('input',()=>{pages.nf2=1;buildNF2();});document.getElementById(id).addEventListener('change',()=>{pages.nf2=1;buildNF2();});});
}


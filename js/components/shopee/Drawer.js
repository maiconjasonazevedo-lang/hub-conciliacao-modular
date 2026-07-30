/**
 * components/shopee/Drawer.js
 * Painel lateral (drawer) de detalhes de pedido.
 * Funções: openDrw, closeDrw.
 * Depende de: f/fBR/fBRsigned/bst (services/shopee/formatters.js).
 * Código movido sem alteração de lógica (seção original: DRAWER).
 */

// ══════════════════════════════════════════════
// DRAWER
// ══════════════════════════════════════════════
function openDrw(r,type){
  const c=document.getElementById('drw-c');
  if(type==='tr'||type==='lib'){
    const isIncome=r.hasFinancial&&r.tipo==='Renda do pedido';
    c.innerHTML=`
      <div class="dt">${r.pedido}</div>
      <div class="ds">${r.tipo||''} &nbsp;·&nbsp; ${fmtDateBR(parseDate(r.data))}</div>
      <div class="dsec">
        <div class="dsec-t">Transação</div>
        <div class="drow"><span class="dlbl">Pagamento</span><span class="dval" style="max-width:220px;word-break:break-word;white-space:normal">${r.pagamento}</span></div>
        <div class="drow"><span class="dlbl">Direção</span><span class="dval">${r.status}</span></div>
        <div class="drow"><span class="dlbl">Valor</span><span class="dval ${fn2(r.valor)>=0?'vpos':'vneg'}">${f(r.valor)}</span></div>
        <div class="drow"><span class="dlbl">Saldo após</span><span class="dval">${f(r.saldo)}</span></div>
        ${r.saque?`<div class="drow"><span class="dlbl">Saque</span><span class="dval vora">${r.saque}</span></div>`:''}
      </div>
      ${r.produto?`<div class="dsec"><div class="dsec-t">Produto</div><div class="drow"><span class="dlbl">Nome</span><span class="dval" style="max-width:220px;word-break:break-word;white-space:normal">${r.produto}</span></div></div>`:''}
      ${r.hasFinancial?`
      <div class="dsec">
        <div class="dsec-t">Detalhes de Renda (como na Shopee)</div>
        <div class="bk">

          <div class="bk-row sec">Subtotal dos Produtos</div>
          <div class="bk-row"><span>Preço do Produto</span><span class="mono">${fBR(r.valorMercadoria)}</span></div>
          ${fn2(r.pix)?`<div class="bk-row ind"><span>Ajuste por pagamento via PIX</span><span class="mono ${fn2(r.pix)<0?'vneg':'vpos'}">${fBRsigned(r.pix)}</span></div>`:''}
          <div class="bk-row" style="font-weight:600;border-top:1px dashed var(--border);margin-top:2px;padding-top:4px">
            <span>Subtotal dos Produtos</span>
            <span class="mono">${fBR(fn2(r.valorMercadoria) + fn2(r.pix))}</span>
          </div>

          <div class="bk-row sec" style="margin-top:8px">Subtotal de Frete</div>
          <div class="bk-row"><span>Taxa de frete paga pelo comprador</span><span class="mono">${fBR(r.taxaEnvio)}</span></div>
          ${fn2(r.freteParceiroLog)?`<div class="bk-row ind"><span>Taxa de Frete Paga pela Shopee para Você</span><span class="mono vpos">${fBR(r.freteParceiroLog)}</span></div>`:'<div class="bk-row ind"><span>Taxa de Frete Paga pela Shopee para Você</span><span class="mono" style="color:var(--text-muted)">R$ 0,00</span></div>'}
          ${fn2(r.freteShop)?`<div class="bk-row ind"><span>Desconto de frete pago pela Shopee</span><span class="mono vpos">+${fBR(r.freteShop)}</span></div>`:''}
          <div class="bk-row" style="font-weight:600;border-top:1px dashed var(--border);margin-top:2px;padding-top:4px">
            <span>Subtotal de Frete</span>
            <span class="mono vpos">${fBR(fn2(r.taxaEnvio) + fn2(r.freteParceiroLog||0) + fn2(r.freteShop))}</span>
          </div>

          <div class="bk-row sec" style="margin-top:8px">Taxas e Encargos</div>
          <div class="bk-row ind"><span>Taxa de comissão líquida</span><span class="mono vneg">-${fBR(r.cl)}</span></div>
          <div class="bk-row ind" style="padding-left:24px;color:var(--text-dim)"><span>Taxa de comissão bruta</span><span class="mono" style="color:var(--text-dim)">-${fBR(r.cb)}</span></div>
          ${fn2(r.ajusteComissao)>0?`<div class="bk-row ind" style="padding-left:24px"><span style="color:var(--purple)">Ajuste por participação em ação comercial</span><span class="mono vpur">+${fBR(r.ajusteComissao)}</span></div>`:''}
          <div class="bk-row ind"><span>Taxa de serviço líquida</span><span class="mono vneg">-${fBR(r.sl)}</span></div>
          ${fn2(r.txTrans)?`<div class="bk-row ind" style="padding-left:24px;color:var(--text-dim)"><span>Taxa de Transação</span><span class="mono vneg">-${fBR(r.txTrans)}</span></div>`:''}
          ${fn2(r.txItem)?`<div class="bk-row ind" style="padding-left:24px;color:var(--text-dim)"><span>Taxa por item vendido</span><span class="mono vneg">-${fBR(r.txItem)}</span></div>`:''}
          ${fn2(r.txR4)?`<div class="bk-row ind" style="padding-left:24px;color:var(--text-dim)"><span>Taxa de R$4 por item</span><span class="mono vneg">-${fBR(r.txR4)}</span></div>`:''}
          ${fn2(r.ajusteServico)>0?`<div class="bk-row ind" style="padding-left:24px"><span style="color:var(--purple)">Ajuste por participação em ação comercial</span><span class="mono vpur">+${fBR(r.ajusteServico)}</span></div>`:''}
          ${fn2(r.txAfil)?`<div class="bk-row ind"><span>Taxa de comissão Afiliados</span><span class="mono vneg">-${fBR(r.txAfil)}</span></div>`:''}
          <div class="bk-row" style="font-weight:600;border-top:1px dashed var(--border);margin-top:2px;padding-top:4px">
            <span>Taxas e Encargos</span>
            <span class="mono vneg">-${fBR(r.totalTaxas)}</span>
          </div>

          <div class="bk-row tot" style="font-size:13px;margin-top:6px;border-top:2px solid var(--orange);padding-top:6px">
            <span>💰 Total Lançado</span>
            <span class="mono vpos" style="font-size:15px">${fBRsigned(r.valor)}</span>
          </div>
        </div>
      </div>`:''}
      <div class="dsec">
        <div class="dsec-t">Nota Fiscal</div>
        <div class="drow"><span class="dlbl">Nº NF</span><span class="dval vblu">${r.nf||'Não localizada'}</span></div>
      </div>`;
  } else {
    c.innerHTML=`
      <div class="dt">${r.pedido}</div>
      <div class="ds">${bst(r.status)} &nbsp; ${r.dataPedido||''}</div>
      <div class="dsec">
        <div class="dsec-t">Pedido</div>
        ${r.cliente?`<div class="drow"><span class="dlbl">Cliente</span><span class="dval">${r.cliente}</span></div>`:''}
        <div class="drow"><span class="dlbl">Produto</span><span class="dval" style="max-width:220px;word-break:break-word;white-space:normal">${r.produto||'–'}</span></div>
        ${r.pagamento?`<div class="drow"><span class="dlbl">Pagamento</span><span class="dval">${r.pagamento}</span></div>`:''}
      </div>
      <div class="dsec">
        <div class="dsec-t">Custos</div>
        <div class="bk">
          <div class="bk-row"><span>Valor Produto</span><span class="mono">${f(r.valorProduto)}</span></div>
          ${fn2(r.frete)?`<div class="bk-row ind"><span>Frete</span><span class="mono">${f(r.frete)}</span></div>`:''}
          <div class="bk-row"><span>Total Pedido</span><span class="mono">${f(r.totalPedido)}</span></div>
          <hr class="hr">
          ${fn2(r.cb)?`<div class="bk-row ind"><span>Comissão bruta</span><span class="mono vneg">${f(r.cb)}</span></div>`:''}
          ${fn2(r.ajusteComissao)?`<div class="bk-row ind vpur"><span>↑ Ajuste AC</span><span class="mono">+${f(r.ajusteComissao)}</span></div>`:''}
          <div class="bk-row"><span>Comissão líquida</span><span class="mono vneg">${f(r.cl)}</span></div>
          ${fn2(r.sb)?`<div class="bk-row ind"><span>Serviço bruto</span><span class="mono vneg">${f(r.sb)}</span></div>`:''}
          <div class="bk-row"><span>Serviço líquido</span><span class="mono vneg">${f(r.sl)}</span></div>
          ${fn2(r.taxaTrans)?`<div class="bk-row ind"><span>Taxa Transação</span><span class="mono vneg">${f(r.taxaTrans)}</span></div>`:''}
          ${fn2(r.txAfil)?`<div class="bk-row ind"><span>Taxa Afiliados</span><span class="mono vneg">${f(r.txAfil)}</span></div>`:''}
          <div class="bk-row tot"><span>Total Taxas</span><span class="mono vneg">${f(r.totalTaxas)}</span></div>
          <div class="bk-row tot" style="font-size:13px"><span>💰 Receita Líquida</span><span class="mono vpos" style="font-size:14px">${f(r.receitaLiq)}</span></div>
        </div>
      </div>
      <div class="dsec">
        <div class="dsec-t">Nota Fiscal</div>
        <div class="drow"><span class="dlbl">Nº NF</span><span class="dval vblu">${r.nf||'Sem NF'}</span></div>
        ${r.dataNF?`<div class="drow"><span class="dlbl">Emissão</span><span class="dval">${r.dataNF}</span></div>`:''}
      </div>`;
  }
  document.getElementById('ov').classList.add('open');
  document.getElementById('drw').classList.add('open');
}
function closeDrw(){document.getElementById('ov').classList.remove('open');document.getElementById('drw').classList.remove('open');}


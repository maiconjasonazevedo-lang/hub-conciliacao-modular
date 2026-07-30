/**
 * services/shopeeNF/shopeeNFExportService.js
 * Exportação Excel do comparativo NF x Orders da Conciliação NF Shopee.
 * Função: snfExportExcel.
 * Depende de: SNF (services/shopeeNF/shopeeNFStorage.js).
 * Código movido sem alteração de lógica (seção original: SHOPEE
 * CONCILIAÇÃO NF — exportar Excel).
 */

// ══════════════════════════════════════════════
// SHOPEE CONCILIAÇÃO NF — exportar Excel
// ══════════════════════════════════════════════
function snfExportExcel() {
  if (!SNF) return;
  const S = SNF;
  const wb = XLSX.utils.book_new();

  // Aba 1: Comparativo NF x Orders
  const TOL = 0.05;
  const cmpData = [
    ['Grupo','Item','Valor NF (R$)','Valor Orders (R$)','Diferença (R$)','Status'],
    ['Comissão','Serv. de comissão',                S.nfComissao,      S.ordComissao,      S.nfComissao - S.ordComissao,      Math.abs(S.nfComissao - S.ordComissao)<=TOL?'OK':'Divergência'],
    ['Comissão','Taxa por item vendido',             S.nfTaxaItem,      S.ordServico,       S.nfTaxaItem - S.ordServico,       Math.abs(S.nfTaxaItem - S.ordServico)<=TOL?'OK':'Divergência'],
    ['Comissão','(-) Abat. devoluções',             -S.nfAbatComissao, -S.ordAbatComissao, -(S.nfAbatComissao - S.ordAbatComissao), Math.abs(S.nfAbatComissao - S.ordAbatComissao)<=TOL?'OK':'Divergência'],
    ['Comissão','TOTAL COMISSÃO',                   S.nfTotalComissao, S.ordTotalComissao, S.nfTotalComissao - S.ordTotalComissao, Math.abs(S.nfTotalComissao - S.ordTotalComissao)<=TOL?'OK':'Divergência'],
    ['Opcionais','(-) Abat. devol. opcionais',      -S.nfAbatOpcionais,0,'—','Sem coluna Orders'],
    ['Processamento','Serv. de processamento',      S.nfProcessamento, S.ordTransacao,     S.nfProcessamento - S.ordTransacao, Math.abs(S.nfProcessamento - S.ordTransacao)<=TOL?'OK':'Divergência'],
    ['Processamento','(-) Abat. devoluções',        -S.nfAbatProc,     -S.ordAbatProc,     -(S.nfAbatProc - S.ordAbatProc),   Math.abs(S.nfAbatProc - S.ordAbatProc)<=TOL?'OK':'Divergência'],
    ['Processamento','TOTAL PROCESSAMENTO',         S.nfTotalProc,     S.ordTotalProc,     S.nfTotalProc - S.ordTotalProc,    Math.abs(S.nfTotalProc - S.ordTotalProc)<=TOL?'OK':'Divergência'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cmpData), 'Comparativo NF x Orders');

  // Aba 2: Pedidos detalhados
  const headers = ['ID Pedido','Data','Status','Status Dev/Reemb','Valor Total','Comissão Liq','Serviço Liq','Transação','Total Comissão','Total Proc','Produto'];
  const detData = [headers, ...S.rows.map(r => [
    r.pedido, r.data.slice(0,10), r.status, r.statusDev||'',
    r.valorTotal, r.comissaoLiq, r.servicoLiq, r.transacao, r.totalComissao, r.totalProc, r.produto
  ])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detData), 'Pedidos Detalhado');

  const periodo = S.periodo.replace(/[→:\s\/]/g,'-').replace(/-+/g,'-');
  XLSX.writeFile(wb, `ConciliacaoNF_Shopee_${periodo}.xlsx`);
}

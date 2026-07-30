/**
 * services/meli/meliExportService.js
 * Exportação do relatório Mercado Livre em formato ODS.
 * Função: downloadMeliODS.
 * Depende de: MELI_DATA (services/meli/meliStorage.js).
 * Código movido sem alteração de lógica (seção original: MERCADO LIVRE
 * — FILE STORAGE & PARSE, parte de exportação).
 */

function downloadMeliODS() {
  if (!MELI_DATA) return;
  const headers = [
    'Pedido ML','Emissão SCA','Nota SCA','Situação',
    'Nota EC','Dt Pedido EC','Dt Emissão EC',
    'Comissão ML','Comissão SCA',
    'ComissaoReal','FreteML',
    'Vl Venda','Vl Comissao EC','Despesa Base','Despesa Desconto ML',
    'Match EC'
  ];
  const rows = [headers];
  MELI_DATA.records.forEach(r => {
    rows.push([
      "'"+r.pedidoML,
      r.emissao,
      r.nota ? "'"+r.nota : '',
      r.situacao,
      r.notaEC  ? "'"+r.notaEC  : '',
      r.dtPedidoEC  || '',
      r.dtEmissaoEC || '',
      r.comissaoML,
      r.comissaoSCA,
      r.hasEC ? r.comissaoReal   : '',
      r.hasEC ? r.freteML        : '',
      r.hasEC ? r.vlVenda        : '',
      r.hasEC ? r.vlComissao     : '',
      r.hasEC ? r.despesaBase    : '',
      r.hasEC ? r.despesaDesconto: '',
      r.hasEC ? 'Sim' : 'Não',
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Conciliação ML');
  const today = new Date().toLocaleDateString('pt-BR').replace(/\//g,'-');
  XLSX.writeFile(wb, `Conciliacao_ML_${today}.ods`, { bookType: 'ods' });
}


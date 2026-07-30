/**
 * services/shopeeNF/shopeeNFService.js
 * Orquestração principal do processamento da Conciliação NF Shopee.
 * Função: snfProcess.
 * Depende de: SNF_ORDERS_RAW (services/shopeeNF/shopeeNFOrdersReader.js),
 * snfParseCurrency/snfNfVal (services/shopeeNF/shopeeNFStorage.js),
 * snfShowResult (components/shopeeNF/ShopeeNFDashboard.js).
 * Código movido sem alteração de lógica (seção original: SHOPEE
 * CONCILIAÇÃO NF — processamento principal).
 */

// ══════════════════════════════════════════════
// SHOPEE CONCILIAÇÃO NF — processamento principal
// ══════════════════════════════════════════════
function snfProcess() {
  if (!SNF_ORDERS_RAW || !SNF_ORDERS_RAW.length) {
    alert('Carregue o relatório de Pedidos (Orders) primeiro.'); return;
  }

  // Colunas do Orders (mapeadas a partir da amostra real)
  const COL_STATUS      = 'Status do pedido';
  const COL_STATUS_DEV  = 'Status da Devolução / Reembolso';
  const COL_PEDIDO      = 'ID do pedido';
  const COL_PRODUTO     = 'Nome do Produto';
  const COL_DATA        = 'Data de criação do pedido';
  const COL_VALOR_TOTAL = 'Valor Total';
  const COL_COM_LIQ     = 'Taxa de comissão líquida';
  const COL_SERV_LIQ    = 'Taxa de serviço líquida';
  const COL_TRANSACAO   = 'Taxa de transação';

  // Status que geram cobrança (não cancelados)
  const STATUS_CANCELADO = /cancelado/i;

  SNF_ROWS = SNF_ORDERS_RAW.map(r => {
    const status     = String(r[COL_STATUS] || '');
    const statusDev  = String(r[COL_STATUS_DEV] || '').trim();
    const cancelado  = STATUS_CANCELADO.test(status);
    const devolvido  = statusDev && statusDev !== '' && statusDev !== '-';

    const comissaoLiq = snfParseCurrency(r[COL_COM_LIQ]);
    const servicoLiq  = snfParseCurrency(r[COL_SERV_LIQ]);
    const transacao   = snfParseCurrency(r[COL_TRANSACAO]);

    return {
      pedido:      String(r[COL_PEDIDO]  || ''),
      produto:     String(r[COL_PRODUTO] || ''),
      data:        String(r[COL_DATA]    || ''),
      status,
      statusDev,
      cancelado,
      devolvido,
      valorTotal:  snfParseCurrency(r[COL_VALOR_TOTAL]),
      comissaoLiq,
      servicoLiq,
      transacao,
      totalComissao: cancelado ? 0 : comissaoLiq + servicoLiq,
      totalProc:     cancelado ? 0 : transacao,
    };
  });

  // Totalizadores Orders — apenas pedidos não cancelados
  const faturados  = SNF_ROWS.filter(r => !r.cancelado);
  const devolvidos = SNF_ROWS.filter(r => !r.cancelado && r.devolvido);

  const ordComissao     = faturados.reduce((s,r) => s + r.comissaoLiq, 0);
  const ordServico      = faturados.reduce((s,r) => s + r.servicoLiq,  0);
  const ordTransacao    = faturados.reduce((s,r) => s + r.transacao,   0);
  const ordAbatComissao = devolvidos.reduce((s,r) => s + r.comissaoLiq + r.servicoLiq, 0);
  const ordAbatProc     = devolvidos.reduce((s,r) => s + r.transacao,  0);

  // Valores da NF
  const nfComissao     = snfNfVal('snf-nf-comissao');
  const nfTaxaItem     = snfNfVal('snf-nf-taxa-item');
  const nfAbatComissao = snfNfVal('snf-nf-abat-comissao');
  const nfAbatOpcionais= snfNfVal('snf-nf-abat-opcionais');
  const nfProcessamento= snfNfVal('snf-nf-processamento');
  const nfAbatProc     = snfNfVal('snf-nf-abat-proc');

  // Totais líquidos
  const nfTotalComissao = nfComissao + nfTaxaItem - nfAbatComissao;
  const ordTotalComissao = ordComissao + ordServico - ordAbatComissao;
  const nfTotalProc      = nfProcessamento - nfAbatProc;
  const ordTotalProc     = ordTransacao - ordAbatProc;

  // Datas do período
  const datas = SNF_ROWS.map(r => r.data).filter(Boolean).sort();
  const periodo = datas.length
    ? datas[0].slice(0,10) + ' → ' + datas[datas.length-1].slice(0,10)
    : '—';

  SNF = {
    rows: SNF_ROWS,
    faturados: faturados.length,
    devolvidos: devolvidos.length,
    cancelados: SNF_ROWS.filter(r => r.cancelado).length,
    ordComissao, ordServico, ordTransacao, ordAbatComissao, ordAbatProc,
    nfComissao, nfTaxaItem, nfAbatComissao, nfAbatOpcionais, nfProcessamento, nfAbatProc,
    nfTotalComissao, ordTotalComissao, nfTotalProc, ordTotalProc,
    periodo,
  };

  snfShowResult();
}


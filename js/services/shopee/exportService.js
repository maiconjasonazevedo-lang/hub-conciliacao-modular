/**
 * services/shopee/exportService.js
 * Exportação CSV no formato Saques_Shopee (ODS).
 * Funções: downloadCSV, csvN.
 * csvN foi movida para cá (estava fisicamente entre a seção de
 * histórico e a seção Amazon no arquivo original, mas só é chamada
 * por downloadCSV aqui e por downloadBaixaDCC em baixaDccService.js —
 * nenhuma referência em código Amazon/Meli/SNF).
 * Depende de: parseDate/fmtDateBR (services/shopee/formatters.js).
 * Código movido sem alteração de lógica (seção original: CSV DOWNLOAD
 * + função csvN).
 */

// ══════════════════════════════════════════════
// CSV DOWNLOAD — formato Saques_Shopee ODS
// Cabeçalho exato conforme especificação
// ══════════════════════════════════════════════
function downloadCSV(){
  if(!D) return;

  // Cabeçalho obrigatório — NÃO alterar ordem nem nomes
  const cols = [
    'Data','Pagamento','Valor pedido','Pedido','Status','Saldo da Carteira',
    'Desconto','Tarifa','Valor Sis','ValorMercadoria','TaxaEnvio','FreteDesconto',
    'Desconto Pix','Prova Real DCC','ProvaReal','Diferença','TaxaPorItem','QtdItens',
    'NF','Cupom Shopee','Moedas Shopee'
  ];

  const csvRows = [cols.join(';')];

  D.transList.forEach(t => {
    const d = parseDate(t.data);
    const dataFmt = d ? fmtDateBR(d) : '';

    if (!t.isOrder) {
      // Saques, ADS e outros sem pedido → #N/DISP nas colunas financeiras
      csvRows.push([
        "'"+dataFmt, t.pagamento, csvN(t.valor), t.pedido||'-', t.status, csvN(t.saldo), '0',
        '#N/DISP','#N/DISP','#N/DISP','#N/DISP','#N/DISP','#N/DISP','#N/DISP','#N/DISP','#N/DISP',
        '','#N/DISP','#N/DISP','#N/DISP','#N/DISP'
      ].join(';'));
      return;
    }

    const h = t.hasFinancial;

    // Data       → datetime do transaction report
    // Pagamento  → tipo (ou descrição para Ajustes)
    // Valor pedido → quantia total lançada (t.valor = base released)
    // Pedido     → order_id normalizado
    // Status     → Entrada/Saída
    // Saldo      → balança após transação

    // Tarifa = cb + sb (brutos — igual ao ODS original)
    const tarifa = h ? round2(fn2(t.cb) + fn2(t.sb)) : 0;

    // ValorMercadoria = Preço do produto (income)
    const valMercRaw = h ? fn2(t.valorMercadoria) : 0;

    // Desconto Pix = valor absoluto do Ajuste PIX (sempre positivo na coluna)
    const rebates = h ? Math.abs(fn2(t.pix)) : 0;

    // ValorMercadoria ajustado = ValorMercadoria - DescontoPix (pix é negativo → subtrai o desconto)
    const valMerc = h ? round2(valMercRaw - Math.abs(fn2(t.pix))) : 0;

    // TaxaEnvio = Taxa de frete paga pelo comprador (income)
    const taxaEnvio = h ? fn2(t.taxaEnvio) : 0;

    // Valor Sis = ValorMercadoria (ajustado) + TaxaEnvio
    const valorSis = h ? round2(valMerc + taxaEnvio) : 0;

    // FreteDesconto = Desconto de frete pela Shopee (income)
    const freteDesc = h ? fn2(t.freteDesconto) : 0;

    // Desconto = Voucher Seller + Coin Cashback (income)
    const desconto = h ? round2(fn2(t.desconto) || 0) : 0;

    // Prova Real DCC = ValorSis + FreteDesconto - Tarifa - ValorPedido
    const provaRealDCC = h ? round2(valorSis + freteDesc - tarifa - fn2(t.valor)) : 0;

    // ProvaReal = (ValorMercadoria - Desconto) * taxa_total_do_pedido
    // taxa_total = (comissão bruta + taxa de transação) / ValorMercadoria
    const provaReal = (() => {
      const base = round2((valMerc || 0) - (desconto || 0));
      if (base <= 0 || !valMerc) return 0;
      const taxaTotal = valMerc > 0 ? (fn2(t.cb) + fn2(t.txTrans)) / valMerc : 0;
      return round2(base * taxaTotal);
    })();

    // Diferença = ProvaReal - (Tarifa - (taxaItem * qtdItens))
    const _qtd = h ? (fn2(t.qtdItens) || 1) : 1;
    const _taxaItem = h ? Math.abs(fn2(t.txItem)) : 0;
    const diferenca = h ? round2(provaReal - (tarifa - (_taxaItem * _qtd))) : 0;

    // TaxaPorItem = taxa por item * qtdItens (conferência)
    const linhas = h ? round2(_taxaItem * _qtd) : 0;

    // QtdItens = quantidade de itens (orders)
    const qtdItens = h ? (fn2(t.qtdItens) || 1) : 1;

    // NF = do anymarket
    const nf = t.nf || '';

    // Cupom Shopee = Cupom da Shopee de Itens Devolvidos (income)
    const cupomShopee = h ? fn2(t.cupomShopee || 0) : 0;

    // Moedas Shopee = Compensar Moedas Shopee (orders)
    const moedasShopee = h ? fn2(t.moedasShopee || 0) : 0;

    csvRows.push([
      "'"+dataFmt,        // Data
      t.pagamento,        // Pagamento
      csvN(t.valor),      // Valor pedido
      t.pedido,           // Pedido
      t.status,           // Status
      csvN(t.saldo),      // Saldo da Carteira
      csvN(desconto),     // Desconto
      csvN(tarifa),       // Tarifa
      csvN(valorSis),     // Valor Sis
      csvN(valMerc),      // ValorMercadoria
      csvN(taxaEnvio),    // TaxaEnvio
      csvN(freteDesc),    // FreteDesconto
      csvN(rebates),      // Desconto Pix
      csvN(provaRealDCC), // Prova Real DCC
      csvN(provaReal),    // ProvaReal
      csvN(diferenca),    // Diferença
      linhas,             // TaxaPorItem
      qtdItens,           // QtdItens
      nf ? "'"+nf : '',   // NF
      csvN(cupomShopee),  // Cupom Shopee
      csvN(moedasShopee), // Moedas Shopee
    ].join(';'));
  });

  // Converter csvRows em worksheet SheetJS e exportar como .ods
  const wsData = csvRows.map(row => row.split(';'));
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Conciliação');
  const today = new Date().toLocaleDateString('pt-BR').replace(/\//g,'-');
  XLSX.writeFile(wb, `Saques_Shopee_${today}.ods`, { bookType: 'ods' });
}

function csvN(v){
  if(v===null||v===undefined||v==='') return '';
  const x=parseFloat(v);
  if(isNaN(x)) return '0';
  // Formato BR: vírgula decimal, sem separador de milhar
  return x.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4});
}

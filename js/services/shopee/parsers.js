/**
 * services/shopee/parsers.js
 * Parsers dos relatórios Shopee/Anymarket e cálculo de taxas.
 * Funções: normalizeId, parseIncome, parseSvcFee, parseTrans,
 * parseAnymarket, parseOrders, calcTaxas.
 * Depende de: wb2arr, findHdrRow, rows2objs (services/shopee/xlsxHelpers.js).
 * Código movido sem alteração de lógica (seção original: PARSERS).
 */

// ══════════════════════════════════════════════
// PARSERS
// ══════════════════════════════════════════════

function parseIncome(wb) {
  const rows = wb2arr(wb, 'Renda');
  if (!rows) throw new Error('Aba "Renda" não encontrada no Income.');
  const hIdx = findHdrRow(rows, ['ID do pedido','Ver','Preço do produto']);
  if (hIdx < 0) throw new Error('Cabeçalho da aba Renda não encontrado.');
  const all = rows2objs(rows, hIdx);
  return all.filter(r => s(r['Ver']) === 'Order');
}

function parseSvcFee(wb) {
  const rows = wb2arr(wb, 'Service Fee Details');
  if (!rows) return {};
  const hIdx = findHdrRow(rows, ['ID do pedido','Taxa de Transação']);
  if (hIdx < 0) return {};
  const map = {};
  rows2objs(rows, hIdx).forEach(r => {
    const id = normalizeId(r['ID do pedido']);
    if (id) map[id] = { taxaTrans: n(r['Taxa de Transação']), taxaItem: n(r['Taxa por item vendido']), taxaR4: n(r['Taxa de R$4 por item']) };
  });
  return map;
}

function parseTrans(wb) {
  const rows = wb2arr(wb, 'Transaction Report');
  if (!rows) throw new Error('Aba "Transaction Report" não encontrada.');
  const hIdx = findHdrRow(rows, ['Data','Tipo de transação','Valor']);
  if (hIdx < 0) throw new Error('Cabeçalho do Transaction Report não encontrado.');
  return rows2objs(rows, hIdx).map(r => ({
    data: s(r['Data']),
    tipo: s(r['Tipo de transação']),
    descricao: s(r['Descrição']),
    idPedido: normalizeId(s(r['ID do pedido']).replace(/^-$/,'')),
    direcao: s(r['Direção do dinheiro']),
    valor: n(r['Valor']),
    saldo: n(r['Balança após as transações']),
    status: s(r['Status']),
  })).filter(r => r.data);
}

// Anymarket aceita array de workbooks
function parseAnymarket(wbList) {
  const map = {};
  wbList.forEach(({wb}) => {
    const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('dado')) || wb.SheetNames[0];
    const rows = wb2arr(wb, sheetName);
    if (!rows) return;
    const hIdx = findHdrRow(rows, ['CÓDIGO PEDIDO','NÚMERO DA NOTA FISCAL']);
    if (hIdx < 0) return;
    rows2objs(rows, hIdx).forEach(r => {
      const id = normalizeId(r['CÓDIGO PEDIDO']);
      if (!id) return;
      // Converter NF: float 178227.0 → "178227", null/"0" → ""
      const nfRaw = r['NÚMERO DA NOTA FISCAL'];
      let nf = '';
      if (nfRaw !== null && nfRaw !== undefined && nfRaw !== '') {
        const nfNum = parseFloat(String(nfRaw));
        if (!isNaN(nfNum) && nfNum > 0) nf = String(Math.round(nfNum));
      }
      // Só sobrescreve se o registro novo tiver NF e o anterior não
      if (!map[id] || (!map[id].nf && nf)) {
        map[id] = {
          nf,
          dataNF: s(r['DATA EMISSÃO NF']),
          status: s(r['STATUS']),
          cliente: s(r['CLIENTE']),
          produto: s(r['TÍTULO PRODUTO']).substring(0,70),
          totalPedido: n(r['TOTAL DO PEDIDO']),
          frete: n(r['FRETE']),
          valorProduto: n(r['VALOR TOTAL DOS PRODUTOS']),
          dataPedido: s(r['DATA PEDIDO']),
          pagamento: s(r['FORMA DE PAGAMENTO']),
          qtd: s(r['QUANTIDADE'])||'1',
        };
      } else if (map[id] && !map[id].nf && nf) {
        map[id].nf = nf;
        map[id].dataNF = s(r['DATA EMISSÃO NF']);
      }
    });
  });
  return map;
}

function parseOrders(wb) {
  const sheetName = wb.SheetNames[0];
  const rows = wb2arr(wb, sheetName);
  if (!rows) return {};
  const hIdx = findHdrRow(rows, ['ID do pedido','Taxa de comissão bruta']);
  if (hIdx < 0) return {};
  const map = {};
  rows2objs(rows, hIdx).forEach(r => {
    const id = normalizeId(r['ID do pedido']);
    if (!id) return;
    map[id] = {
      comissaoBruta:    n(r['Taxa de comissão bruta']),
      comissaoLiquida:  n(r['Taxa de comissão líquida']),
      servicoBruto:     n(r['Taxa de serviço bruta']),
      servicoLiquido:   n(r['Taxa de serviço líquida']),
      taxaTrans:        n(r['Taxa de transação']),
      txAfil:           n(r['Taxa de comissão Afiliados do Vendedor']||0),
      ajusteAC:         n(r['Ajuste por participação em ação comercial']),
      incentivos:       n(r['Incentivo Shopee para ação comercial']),
      totalGlobal:      n(r['Total global']),
      status:           s(r['Status do pedido']),
      subtotal:         n(r['Subtotal do produto']),
      // campos extras para CSV
      cupomShopee:      n(r['Cupom Shopee']||0),
      moedasShopee:     n(r['Compensar Moedas Shopee']||0),
      descontoVendedor: n(r['Desconto do vendedor']||0),
      qtdItens:         n(r['Número de produtos pedidos']||0),
    };
  });
  return map;
}


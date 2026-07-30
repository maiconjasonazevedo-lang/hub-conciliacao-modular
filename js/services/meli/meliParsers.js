/**
 * services/meli/meliParsers.js
 * Parsers dos relatórios Mercado Livre: SCA (Saldo/Comissão/Anúncio)
 * e EC (Extrato de Conta).
 * Funções: parseSCA, parseEC.
 * IMPORTANTE: independentes dos parsers Shopee (services/shopee/parsers.js)
 * — cada marketplace lê e interpreta sua própria planilha.
 * Código movido sem alteração de lógica (seção original: MERCADO LIVRE
 * — FILE STORAGE & PARSE, parte de parsers).
 */

function parseSCA(fileObj) {
  const map = {};
  let rows;
  if (fileObj.wb) {
    const sheetName = fileObj.wb.SheetNames[0];
    rows = XLSX.utils.sheet_to_json(fileObj.wb.Sheets[sheetName], { header: 1, defval: null, raw: false });
  } else {
    // SpreadsheetML via TextDecoder
    const dec = new TextDecoder('utf-8');
    const xmlStr = dec.decode(fileObj.raw);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
    const ns = 'urn:schemas-microsoft-com:office:spreadsheet';
    const wsEls = xmlDoc.getElementsByTagNameNS(ns, 'Worksheet');
    if (!wsEls.length) return map;
    const tableEl = wsEls[0].getElementsByTagNameNS(ns, 'Table')[0];
    const rowEls = tableEl.getElementsByTagNameNS(ns, 'Row');
    rows = [];
    for (let r = 0; r < rowEls.length; r++) {
      const cellEls = rowEls[r].getElementsByTagNameNS(ns, 'Cell');
      const rowData = [];
      for (let c = 0; c < cellEls.length; c++) {
        const dataEl = cellEls[c].getElementsByTagNameNS(ns, 'Data')[0];
        rowData.push(dataEl ? dataEl.textContent : null);
      }
      rows.push(rowData);
    }
  }

  // Encontrar linha do header (contém 'Pedido ML')
  let hIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    if (rows[i] && rows[i].some(c => String(c||'').trim() === 'Pedido ML')) { hIdx = i; break; }
  }
  if (hIdx < 0) return map;

  const headers = rows[hIdx].map(c => String(c||'').trim());
  const idxPedido    = headers.indexOf('Pedido ML');
  // 'Emissão' aparece duas vezes: col 1 = data do pedido, col 5 = data emissão NF → usar a última
  const idxEmissao   = headers.lastIndexOf('Emissão');
  const idxNota      = headers.indexOf('Nota');
  const idxSituacao  = headers.indexOf('Situação');
  const idxComML     = headers.indexOf('Comissão ML');
  const idxComSCA    = headers.indexOf('Comissão SCA');

  for (let i = hIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[idxPedido]) continue;
    const pid = String(row[idxPedido]).trim();
    // Filtrar apenas IDs numéricos reais (8+ dígitos) — exclui totais, rodapés, datas, textos
    if (!/^\d{8,}$/.test(pid)) continue;

    map[pid] = {
      pedidoML:    pid,
      emissao:     String(row[idxEmissao]||'').trim(),
      nota:        String(row[idxNota]||'').trim(),
      situacao:    String(row[idxSituacao]||'').trim(),
      comissaoML:  parseFloat(String(row[idxComML]||'0').replace(',','.')) || 0,
      comissaoSCA: parseFloat(String(row[idxComSCA]||'0').replace(',','.')) || 0,
      // Campos do EC (preenchidos no cruzamento)
      notaEC: '', dtEmissaoEC: '', dtPedidoEC: '',
      vlVenda: 0, vlComissao: 0,
      despesaBase: 0, despesaDesconto: 0,
      comissaoReal: 0, freteML: 0, hasEC: false,
    };
  }
  return map;
}

// Parse E-commerce SpreadsheetML (JVCR4010):
// Linha de pedido: [PedidoMarketplace, PedidoVenda, NotaFiscal, DtPedido, DtEmissao, VlVenda, VlComissao]
// Linha de detalhe: "Item N: ... Despesa Base: X ... Frete Marketplace recebido da Any: Y ..."
function parseEC(fileObj) {
  const map = {};
  let rows;

  if (fileObj.wb) {
    // XLSX.js expande células com MergeAcross → usar header por nome, não por índice fixo
    const sheetName = fileObj.wb.SheetNames[0];
    rows = XLSX.utils.sheet_to_json(fileObj.wb.Sheets[sheetName], { header: 1, defval: null, raw: false });
  } else {
    const dec = new TextDecoder('utf-8');
    const xmlStr = dec.decode(fileObj.raw);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
    const ns = 'urn:schemas-microsoft-com:office:spreadsheet';
    const wsEls = xmlDoc.getElementsByTagNameNS(ns, 'Worksheet');
    if (!wsEls.length) return map;
    const tableEl = wsEls[0].getElementsByTagNameNS(ns, 'Table')[0];
    const rowEls = tableEl.getElementsByTagNameNS(ns, 'Row');
    rows = [];
    for (let r = 0; r < rowEls.length; r++) {
      const cellEls = rowEls[r].getElementsByTagNameNS(ns, 'Cell');
      const rowData = [];
      for (let c = 0; c < cellEls.length; c++) {
        const dataEl = cellEls[c].getElementsByTagNameNS(ns, 'Data')[0];
        rowData.push(dataEl ? dataEl.textContent : null);
      }
      rows.push(rowData);
    }
  }

  // Descobrir índices das colunas pelo cabeçalho (robusto contra MergeAcross expandido)
  // O cabeçalho contém: Pedido Marketplace, Pedido Venda, Nota Fiscal, Dt Pedido Marketplace, Dt Emissão, Vl Venda, Vl Comissão
  let iMkt=-1, iVenda=-1, iNF=-1, iDtPed=-1, iDtEmi=-1, iVlVenda=-1, iVlCom=-1;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    if (!rows[i]) continue;
    const h = rows[i].map(c => String(c||'').trim());
    // Localiza pelo primeiro cabeçalho que contém 'Pedido Marketplace'
    const mktIdx = h.findIndex(v => v === 'Pedido Marketplace');
    if (mktIdx >= 0) {
      iMkt    = mktIdx;
      // Encontra demais colunas pelo nome, pegando a PRIMEIRA ocorrência após iMkt
      iVenda  = h.findIndex((v,j) => j>iMkt && (v==='Pedido Venda'||v==='Venda'));
      iNF     = h.findIndex((v,j) => j>iMkt && (v==='Nota Fiscal'||v==='Nota'));
      iDtPed  = h.findIndex((v,j) => j>iMkt && (v==='Dt Pedido Marketplace'||v.startsWith('Dt Pedido')));
      iDtEmi  = h.findIndex((v,j) => j>iMkt && (v==='Dt Emissão'||v==='Dt Emissao'||v.startsWith('Dt Emiss')));
      iVlVenda= h.findIndex((v,j) => j>iMkt && (v==='Vl Venda'||v==='Vl. Venda'));
      iVlCom  = h.findIndex((v,j) => j>iMkt && (v==='Vl Comissão'||v==='Vl. Comissão'||v==='Vl Comissao'));
      break;
    }
  }
  // Fallback para índices compactos (path XML sem expansão de merge)
  if (iMkt < 0) { iMkt=0; iVenda=1; iNF=2; iDtPed=3; iDtEmi=4; iVlVenda=5; iVlCom=6; }

  const toF = v => parseFloat(String(v||'0').replace(',','.')) || 0;
  const reNum = (str, label) => {
    const m = str.match(new RegExp(label.replace(/[()]/g,'\\$&') + ':\\s*([\\d.,]+)'));
    return m ? toF(m[1]) : 0;
  };

  // Acumula despesas de todos os itens de uma célula (separados por #10; ou newline)
  function _acumItens(cur, itemText) {
    const itens = itemText.split(/\n|#10;/).map(s => s.trim()).filter(s => s.startsWith('Item '));
    for (const it of itens) {
      cur.despesaBase     += reNum(it, 'Despesa Base');
      cur.despesaDesconto += reNum(it, 'Despesa do Desconto Mercado Livre');
      cur.freteML         += reNum(it, 'Frete Marketplace recebido da Any');
    }
  }

  let cur = null;
  for (const row of rows) {
    // Usa iMkt para identificar coluna do pedido; fallback 0 se não encontrado
    const _col0 = iMkt >= 0 ? iMkt : 0;
    if (!row || !row[_col0]) continue;
    const first = String(row[_col0]).trim();

    // Linha de detalhe do item (pode conter múltiplos itens separados por #10; ou \n)
    if (first.startsWith('Item ')) {
      if (cur) _acumItens(cur, first);
      continue;
    }

    // Linha de pedido: ID numérico com 10+ dígitos
    if (/^\d{10,}$/.test(first)) {
      if (cur) {
        cur.comissaoReal = Math.round((cur.despesaBase + cur.despesaDesconto) * 100) / 100;
        cur.freteML      = Math.round(cur.freteML * 100) / 100;
        map[cur.pedidoMkt] = cur;
      }
      // Usar índices dinâmicos (robustos contra expansão de MergeAcross pelo XLSX.js)
      const _g = i => (i >= 0 && row[i] != null) ? String(row[i]).trim() : '';
      cur = {
        pedidoMkt:   first,
        pedidoVenda: _g(iVenda),
        notaFiscal:  _g(iNF),
        dtPedido:    _g(iDtPed),
        dtEmissao:   _g(iDtEmi),
        vlVenda:     toF(_g(iVlVenda)),
        vlComissao:  toF(_g(iVlCom)),
        despesaBase: 0, despesaDesconto: 0, freteML: 0,
        comissaoReal: 0,
      };
      continue;
    }

    // Linha não-pedido: salva cur pendente
    if (cur) {
      cur.comissaoReal = Math.round((cur.despesaBase + cur.despesaDesconto) * 100) / 100;
      cur.freteML      = Math.round(cur.freteML * 100) / 100;
      map[cur.pedidoMkt] = cur;
      cur = null;
    }
  }
  if (cur) {
    cur.comissaoReal = Math.round((cur.despesaBase + cur.despesaDesconto) * 100) / 100;
    cur.freteML      = Math.round(cur.freteML * 100) / 100;
    map[cur.pedidoMkt] = cur;
  }
  return map;
}

// ── PROCESSAR ML ──

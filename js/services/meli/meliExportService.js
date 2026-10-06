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
    'Pedido ML (JVCR6011)','Emissão SCA (JVCR6011)','Nota SCA (JVCR6011)','Situação (JVCR6011)',
    'Nota (JVCR4010)','Dt Pedido (JVCR4010)','Dt Emissão (JVCR4010)',
    'Comissão ML (JVCR6011)','Comissão SCA (JVCR6011)',
    'ComissaoReal','FreteML',
    'Vl Venda (JVCR4010)','Vl Comissao (JVCR4010)','Despesa Base (JVCR4010)','Despesa Desconto ML (JVCR4010)',
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
  // Rodapé explicativo (legenda de cores) — apenas texto, sem alterar colunas
  rows.push([]);
  rows.push(['Legenda:']);
  rows.push(['🟨 JVCR6011 (SCA): Pedido ML (JVCR6011), Emissão SCA (JVCR6011), Nota SCA (JVCR6011), Situação (JVCR6011), Comissão ML (JVCR6011), Comissão SCA (JVCR6011)']);
  rows.push(['🟦 JVCR4010 (EC): Nota (JVCR4010), Dt Pedido (JVCR4010), Dt Emissão (JVCR4010), Vl Venda (JVCR4010), Vl Comissao (JVCR4010), Despesa Base (JVCR4010), Despesa Desconto ML (JVCR4010), FreteML']);
  rows.push(['🟩 Calculado pelo sistema: ComissaoReal, Match EC']);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  // Colorir visualmente o cabeçalho conforme a origem dos campos
  try {
    const headerRow = headers;
    const colorFor = label => {
      // 🟨 SCA (header texts updated)
      const sca = ['Pedido ML (JVCR6011)','Emissão SCA (JVCR6011)','Nota SCA (JVCR6011)','Situação (JVCR6011)','Comissão ML (JVCR6011)','Comissão SCA (JVCR6011)'];
      // 🟦 EC (header texts updated)
      const ec  = ['Nota (JVCR4010)','Dt Pedido (JVCR4010)','Dt Emissão (JVCR4010)','Vl Venda (JVCR4010)','Vl Comissao (JVCR4010)','Despesa Base (JVCR4010)','Despesa Desconto ML (JVCR4010)','FreteML'];
      // 🟩 Calculados
      const calc = ['ComissaoReal','Match EC'];
      if (sca.includes(label)) return 'FFFFFF00'; // amarelo
      if (ec.includes(label))  return 'FF00B0F0'; // azul claro
      if (calc.includes(label)) return 'FF00B050'; // verde
      return null;
    };

    for (let c = 0; c < headerRow.length; c++) {
      const addr = XLSX.utils.encode_cell({ c: c, r: 0 });
      const col = headerRow[c];
      const clr = colorFor(col);
      if (!clr) continue;
      ws[addr] = ws[addr] || { v: headerRow[c] };
      ws[addr].t = 's';
      ws[addr].s = ws[addr].s || {};
      ws[addr].s.fill = { fgColor: { rgb: clr } };
      ws[addr].s.font = ws[addr].s.font || {};
      ws[addr].s.font.bold = true;
      ws[addr].s.alignment = { horizontal: 'center', vertical: 'center' };
    }
  } catch (e) {
    // Falha na aplicação de estilo não deve interromper a exportação
    console.warn('Header styling skipped:', e && e.message);
  }
  // Pintar todas as células das colunas conforme origem (mantém rodapé sem colorir)
  try {
    const footerCount = 5; // blank + legenda + 3 linhas de legenda
    const lastDataRow = Math.max(0, rows.length - footerCount - 1);
    for (let c = 0; c < headers.length; c++) {
      const colLabel = headers[c];
        const clr = (function(label) {
        const sca = ['Pedido ML (JVCR6011)','Emissão SCA (JVCR6011)','Nota SCA (JVCR6011)','Situação (JVCR6011)','Comissão ML (JVCR6011)','Comissão SCA (JVCR6011)'];
        const ec  = ['Nota (JVCR4010)','Dt Pedido (JVCR4010)','Dt Emissão (JVCR4010)','Vl Venda (JVCR4010)','Vl Comissao (JVCR4010)','Despesa Base (JVCR4010)','Despesa Desconto ML (JVCR4010)','FreteML'];
        const calc = ['ComissaoReal','Match EC'];
        if (sca.includes(label)) return 'FFFFFF00';
        if (ec.includes(label))  return 'FF00B0F0';
        if (calc.includes(label)) return 'FF00B050';
        return null;
      })(colLabel);
      if (!clr) continue;
      for (let r = 0; r <= lastDataRow; r++) {
        const addr = XLSX.utils.encode_cell({ c: c, r: r });
        const val = (rows[r] && rows[r][c] !== undefined) ? rows[r][c] : '';
        ws[addr] = ws[addr] || { v: val };
        // Preserve numeric types when possible
        if (typeof val === 'number') ws[addr].t = 'n'; else ws[addr].t = 's';
        ws[addr].s = ws[addr].s || {};
        ws[addr].s.fill = { fgColor: { rgb: clr } };
      }
    }
  } catch (e) {
    console.warn('Column styling skipped:', e && e.message);
  }
  // Estilizar rodapé: texto em itálico e cor discreta
  try {
    const footerCount = 5; // blank + legenda + 3 linhas de legenda
    const firstFooterRow = rows.length - footerCount; // index of blank row
    for (let r = firstFooterRow + 1; r < rows.length; r++) {
      const addr = XLSX.utils.encode_cell({ c: 0, r });
      ws[addr] = ws[addr] || { v: rows[r][0] || '' };
      ws[addr].t = 's';
      ws[addr].s = ws[addr].s || {};
      ws[addr].s.font = ws[addr].s.font || {};
      ws[addr].s.font.italic = true;
      ws[addr].s.font.sz = 9;
      ws[addr].s.font.color = { rgb: 'FF666666' };
      ws[addr].s.alignment = { wrapText: true, horizontal: 'left' };
    }
  } catch (e) {
    console.warn('Footer styling skipped:', e && e.message);
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Conciliação ML');
  const today = new Date().toLocaleDateString('pt-BR').replace(/\//g,'-');
  XLSX.writeFile(wb, `Conciliacao_ML_${today}.ods`, { bookType: 'ods' });
  
}


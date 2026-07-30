/**
 * services/shopee/baixaDccService.js
 * Upload/cruzamento do relatório de Baixa DCC e exportação no formato 988.
 * Funções: loadBaixaDCC, downloadBaixaDCC.
 * Depende de: csvN (services/shopee/exportService.js).
 * Código movido sem alteração de lógica (seção original: BAIXA DCC).
 */

// ══════════════════════════════════════════════
// BAIXA DCC — upload do relatório gerado + exportar no formato 988
// ══════════════════════════════════════════════
let BAIXA_ROWS = null;

function loadBaixaDCC(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array', raw: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // Ler como array de arrays para manter a ordem das colunas
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!data || data.length < 2) { alert('Arquivo vazio ou sem dados.'); return; }

      // Linha 0 = cabeçalho, demais = dados
      const headers = data[0].map(h => String(h).trim());
      // Mapear índices pelas colunas esperadas
      const idx = name => headers.indexOf(name);
      const iNF      = idx('NF');
      const iValSis  = idx('Valor Sis');
      const iFrete   = idx('FreteDesconto');
      const iTarifa  = idx('Tarifa');
      const iPedido  = idx('Pedido');

      if ([iNF, iValSis, iFrete, iTarifa, iPedido].some(i => i < 0)) {
        alert('Colunas não encontradas. Verifique se o arquivo é o relatório DCC gerado por este sistema.\nNecessário: NF, Valor Sis, FreteDesconto, Tarifa, Pedido');
        return;
      }

      BAIXA_ROWS = { data, iNF, iValSis, iFrete, iTarifa, iPedido };
      const btn = document.getElementById('btn-baixa-dcc');
      btn.disabled = false;
      btn.style.opacity = '1';
      // Contar linhas válidas (com NF)
      const valid = data.slice(1).filter(r => r[iNF] && String(r[iNF]).trim() && String(r[iNF]).trim() !== '#N/DISP').length;
      btn.textContent = `⬇ Baixa DCC (${valid})`;
    } catch(err) { alert('Erro ao ler arquivo: ' + err.message); }
  };
  reader.readAsArrayBuffer(file);
}

function downloadBaixaDCC() {
  if (!BAIXA_ROWS) return;
  const { data, iNF, iValSis, iFrete, iTarifa, iPedido } = BAIXA_ROWS;

  const lines = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const nfRaw   = String(row[iNF]  || '').replace(/^'/,'').trim();
    const pedido  = String(row[iPedido] || '').replace(/^'/,'').trim();
    if (!nfRaw || nfRaw === '#N/DISP' || nfRaw === '') continue;

    // Extrair número e série da NF — ex: "173363/15" → nf=173363, serie=15
    // ou NF simples "177672" com série do sistema = 15 (padrão Shopee)
    let nfNum, serieNF;
    if (nfRaw.includes('/')) {
      const parts = nfRaw.split('/');
      nfNum   = parts[0].trim();
      serieNF = parts[1].trim();
    } else {
      nfNum   = nfRaw;
      serieNF = '15'; // série padrão
    }

    const valSis = csvN(row[iValSis]);
    const frete  = csvN(row[iFrete]);
    const tarifa = csvN(row[iTarifa]);

    // Formato: 988;NF;SerieNF;1;ValorSis;0;FreteDesconto;Tarifa;Pedido
    lines.push(['988', nfNum, serieNF, '1', valSis, '0', frete, tarifa, pedido].join(';'));
  }

  if (!lines.length) { alert('Nenhuma linha com NF válida encontrada.'); return; }

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toLocaleDateString('pt-BR').replace(/\//g,'-');
  a.href = url;
  a.download = `Baixa_DCC_${today}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


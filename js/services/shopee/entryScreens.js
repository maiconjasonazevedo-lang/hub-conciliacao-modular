/**
 * services/shopee/entryScreens.js
 * Telas de entrada da Conciliação Shopee (carregar sessão anterior,
 * novo upload, ou tela vazia).
 * Funções: _hideAllShopee, _buildDFromRecords, _showShopeeResult,
 * entryLoadShopee, entryNewUploadShopee, entryEmptyShopee.
 * Depende de: showApp() (components/shopee/Dashboard.js), calcTaxas()
 * (services/shopee/parsers.js), fmtDateBR()/round2() (services/shopee/formatters.js).
 * Código movido sem alteração de lógica (seção original: ENTRY SCREENS — Shopee).
 */

// ══════════════════════════════════════════════
// ENTRY SCREENS — Shopee
// ══════════════════════════════════════════════
function _hideAllShopee() {
  document.getElementById('shopee-entry-screen').style.display = 'none';
  document.getElementById('shopee-app').style.display            = 'none';
}

// Reconstrói D a partir de um array flat de transList (vindo do JSON salvo)
function _buildDFromRecords(records) {
  const transList = records;
  const released  = transList.filter(r => r.tipo === 'Renda do pedido' && r.isOrder);

  // Reconstruir saques: agrupar por label e somar os valores absolutos das transações de saque
  const saqMap = new Map();
  transList.forEach(r => {
    if (r.saque && !r.saque.includes('Futuro')) {
      if (!saqMap.has(r.saque)) {
        const datePart = r.saque.split('|')[0].replace('Saque ','').trim();
        saqMap.set(r.saque, { label: r.saque, valor: 0, data: datePart, ts: 0, dataObj: null });
      }
    }
  });
  // Recuperar valor real do saque a partir das próprias linhas de tipo "Saques" no transList
  transList.forEach(r => {
    if (r.tipo === 'Saques') {
      const lbl = r.saque || makeSaqLabel(r.data, r.valor);
      if (saqMap.has(lbl)) {
        saqMap.get(lbl).valor = Math.abs(r.valor || 0);
      }
    }
  });

  // Reconstruir current: agrupar transações de pedidos por ID,
  // acumulando totalPedido (valorSis) e totalTaxas, mantendo status
  const curMap = new Map();
  transList.forEach(r => {
    if (!r.isOrder || !r.pedido || r.pedido === '-') return;
    if (!curMap.has(r.pedido)) {
      curMap.set(r.pedido, {
        pedido:      r.pedido,
        status:      r.status || '',
        totalPedido: 0,
        totalTaxas:  0,
        nf:          r.nf    || '',
        produto:     r.produto || '',
      });
    }
    const entry = curMap.get(r.pedido);
    entry.totalPedido += fn2(r.valorSis    || r.valorMercadoria || 0);
    entry.totalTaxas  += fn2(r.totalTaxas  || 0);
    // status mais "faturado" prevalece
    if (['Faturado','Enviado','Pago'].includes(r.status)) entry.status = r.status;
    if (!entry.nf && r.nf) entry.nf = r.nf;
  });
  const current = Array.from(curMap.values());

  D = { transList, released, current, saques: Array.from(saqMap.values()) };
}

function _showShopeeResult() {
  if (!D) D = { transList: [], released: [], current: [], saques: [] };
  // Garante arrays mínimos para não quebrar renders
  D.current  = D.current  || [];
  D.saques   = D.saques   || [];
  D.released = D.released || [];

  const allDatas = D.transList.map(t => t.data).filter(Boolean).sort();
  const period = allDatas.length
    ? fmtDateBR(parseDate(allDatas[0]),'date') + ' – ' + fmtDateBR(parseDate(allDatas[allDatas.length-1]),'date')
    : '—';

  // Garante que shopee-app está visível e upload-screen oculto antes de showApp
  document.getElementById('shopee-entry-screen').style.display = 'none';
  document.getElementById('shopee-app').style.display          = 'block';
  document.getElementById('upload-screen').style.display       = 'none';
  document.getElementById('app-screen').style.display          = 'none'; // showApp vai mostrar

  showApp(period);
}

function entryLoadShopee(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      HIST_SHOPEE  = Array.isArray(parsed) ? parsed : (parsed.records || []);
      _buildDFromRecords(HIST_SHOPEE);
      _showShopeeResult();
    } catch(err) { alert('Erro ao ler JSON: ' + err.message); }
  };
  reader.readAsText(file, 'utf-8');
  evt.target.value = '';
}

function entryNewUploadShopee() {
  document.getElementById('shopee-entry-screen').style.display = 'none';
  document.getElementById('app-screen').style.display          = 'none';
  document.getElementById('shopee-app').style.display          = 'block';
  document.getElementById('upload-screen').style.display       = 'flex';
}

function entryEmptyShopee() {
  _buildDFromRecords([]);
  _showShopeeResult();
}


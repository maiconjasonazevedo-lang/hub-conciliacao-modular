/**
 * services/shopee/historyService.js
 * Leitura/gravação do histórico local (JSON) específico do Shopee.
 * Funções: loadHistShopee, saveHistShopee.
 * Depende de: HIST_SHOPEE, mergeById, downloadJSON (Etapa 1 —
 * managers/HistoryStorageManager.js) e da variável global D
 * (services/shopee/processFiles.js).
 * Código movido sem alteração de lógica (seção original: HISTÓRICO JSON
 * — Shopee & Mercado Livre, parte '── SHOPEE ──').
 */

// ── SHOPEE ──
function loadHistShopee(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      HIST_SHOPEE = Array.isArray(parsed) ? parsed : (parsed.records || []);
      alert('✓ Histórico Shopee carregado: ' + HIST_SHOPEE.length + ' registros.');
    } catch(err) { alert('Erro ao ler JSON: ' + err.message); }
  };
  reader.readAsText(file, 'utf-8');
}

function saveHistShopee() {
  if (!D || !D.transList || !D.transList.length) { alert('Processe a conciliação antes de salvar.'); return; }
  const merged = mergeById(HIST_SHOPEE, D.transList, 'pedido');
  const today  = new Date().toLocaleDateString('pt-BR').replace(/\//g,'-');
  downloadJSON(merged, 'Historico_Shopee_' + today + '.json');
}

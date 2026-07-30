/**
 * services/meli/historyService.js
 * Leitura/gravação do histórico local (JSON) específico do Mercado Livre.
 * Funções: loadHistML, saveHistML.
 * Depende de: HIST_ML, mergeById, downloadJSON (Etapa 1 —
 * managers/HistoryStorageManager.js) e da variável global MELI_DATA
 * (services/meli/meliStorage.js).
 * Código movido sem alteração de lógica (seção original: HISTÓRICO JSON
 * — Shopee & Mercado Livre, parte '── MERCADO LIVRE ──').
 */

// ── MERCADO LIVRE ──
function loadHistML(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      HIST_ML = Array.isArray(parsed) ? parsed : (parsed.records || []);
      alert('✓ Histórico ML carregado: ' + HIST_ML.length + ' registros.');
    } catch(err) { alert('Erro ao ler JSON: ' + err.message); }
  };
  reader.readAsText(file, 'utf-8');
}

function saveHistML() {
  if (!MELI_DATA || !MELI_DATA.records || !MELI_DATA.records.length) { alert('Processe a conciliação ML antes de salvar.'); return; }
  const merged = mergeById(HIST_ML, MELI_DATA.records, 'pedidoML');
  const today  = new Date().toLocaleDateString('pt-BR').replace(/\//g,'-');
  downloadJSON(merged, 'Historico_ML_' + today + '.json');
}

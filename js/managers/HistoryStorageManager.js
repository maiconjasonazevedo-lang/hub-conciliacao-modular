/**
 * managers/HistoryStorageManager.js
 * Infraestrutura genérica de histórico local (JSON), compartilhada por
 * Shopee e Mercado Livre: estado (HIST_SHOPEE / HIST_ML) e as funções
 * genéricas mergeById() e downloadJSON().
 *
 * As funções de leitura/gravação específicas de cada marketplace
 * (loadHistShopee/saveHistShopee e loadHistML/saveHistML) permanecem
 * nos módulos Shopee e Mercado Livre (Etapas 2 e 3), pois dependem de
 * variáveis globais (D, MELI_DATA) e regras específicas de cada um.
 *
 * Código movido sem nenhuma alteração de lógica (seção original:
 * HISTÓRICO JSON — Shopee & Mercado Livre, parte genérica).
 */

// ══════════════════════════════════════════════
// HISTÓRICO JSON — Shopee & Mercado Livre
// ══════════════════════════════════════════════
let HIST_SHOPEE = [];
let HIST_ML     = [];

// Merge por chave única: novos sobrescrevem antigos
function mergeById(oldArr, newArr, key) {
  const map = new Map();
  oldArr.forEach(r => { if (r[key] != null) map.set(String(r[key]), r); });
  newArr.forEach(r => { if (r[key] != null) map.set(String(r[key]), r); });
  return Array.from(map.values());
}

// Baixa um arquivo JSON com { version, updatedAt, records }
function downloadJSON(records, filename) {
  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    records,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

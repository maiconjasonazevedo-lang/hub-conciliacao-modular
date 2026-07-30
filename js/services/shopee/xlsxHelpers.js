/**
 * services/shopee/xlsxHelpers.js
 * Helpers de leitura de planilha XLSX usados pelos parsers Shopee.
 * Funções: wb2arr, findHdrRow, dedupeHeaders, rows2objs.
 * IMPORTANTE: apesar do nome genérico, estas funções são usadas
 * exclusivamente pelos parsers Shopee (services/shopee/parsers.js) —
 * Mercado Livre, Amazon e Shopee NF fazem sua própria leitura de XLSX
 * de forma independente e não devem ser alterados para reusar isto
 * (evita mudança de comportamento).
 * Código movido sem alteração de lógica (seção original: XLSX HELPERS).
 */

// ══════════════════════════════════════════════
// XLSX HELPERS
// ══════════════════════════════════════════════
function wb2arr(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return null;
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
}

// Encontra linha do cabeçalho buscando por marcadores
function findHdrRow(rows, markers) {
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const r = rows[i].map(c => String(c||'').trim());
    if (markers.every(m => r.some(c => c === m || c.includes(m)))) return i;
  }
  return -1;
}

// Deduplica cabeçalhos
function dedupeHeaders(headers) {
  const seen = {};
  return headers.map(h => {
    const k = String(h||'').trim();
    if (seen[k] !== undefined) { seen[k]++; return k+'_'+seen[k]; }
    seen[k] = 0; return k;
  });
}

function rows2objs(rows, hdrIdx) {
  const headers = dedupeHeaders(rows[hdrIdx]);
  const result = [];
  for (let i = hdrIdx+1; i < rows.length; i++) {
    if (!rows[i] || rows[i].every(c => c===null||c===undefined||String(c).trim()==='')) continue;
    const obj = {};
    headers.forEach((h,j) => { obj[h] = rows[i][j]; });
    result.push(obj);
  }
  return result;
}

const n = v => {
  if (v===null||v===undefined||v==='') return 0;
  let str = String(v).trim();
  if (str.includes(',') && str.includes('.')) str = str.replace(/\./g,'').replace(',','.');
  else if (str.includes(',')) str = str.replace(',','.');
  const x = parseFloat(str);
  return isNaN(x) ? 0 : x;
};
const s = v => v==null?'':String(v).trim();

// Normaliza IDs: remove .0, espaços, invisíveis
function normalizeId(v) {
  if (!v) return '';
  return String(v).trim().replace(/\.0+$/,'').trim();
}


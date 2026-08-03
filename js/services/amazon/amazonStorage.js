/**
 * services/amazon/amazonStorage.js
 * Estado, formatadores e upload dos arquivos de Settlement Amazon.
 * Estado: AMZ_DATA, amzRawFiles, amzPage, AMZ_PS.
 * Funções: amzN, amzFmtSigned, amzSt, entryNewUploadAmazon, loadAmzFiles.
 * IMPORTANTE: amzN/amzFmtSigned são formatadores próprios do Amazon,
 * independentes de services/shopee/formatters.js.
 * Código movido sem alteração de lógica (seção original: AMAZON —
 * MÓDULO, parte de estado/upload).
 */

// ══════════════════════════════════════════════
// AMAZON — MÓDULO
// ══════════════════════════════════════════════

let AMZ_DATA    = null;  // { rows: [], settlements: [] }
let amzRawFiles = [];
let amzPage     = 1;
const AMZ_PS    = 50;

function amzN(str) {
  if (str === null || str === undefined || str === '') return 0;
  const s = String(str).trim();
  if (s.includes(',') && s.includes('.')) return parseFloat(s.replace(/\./g,'').replace(',','.')) || 0;
  if (s.includes(',')) return parseFloat(s.replace(',','.')) || 0;
  return parseFloat(s) || 0;
}
function amzFmtSigned(v) {
  const abs = Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  return (v < 0 ? '-' : '') + 'R$ ' + abs;
}
function buildAmzContentHash(text) {
  const input = String(text || '');
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function renderAmzDedupSummary(items) {
  const container = document.getElementById('amz-dedup-summary');
  if (!container) return;
  if (!Array.isArray(items) || !items.length) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }
  const rows = items.map(item => {
    const label = item.status === 'ignored'
      ? `⚠️ Ignorado por duplicidade: ${item.fileName}`
      : `✅ Processado: ${item.fileName}`;
    const detail = item.status === 'ignored'
      ? `original: ${item.originalName || '—'} · hash: ${item.fileHash || '—'}`
      : `hash: ${item.fileHash || '—'}`;
    return `<div><strong>${label}</strong><br><span>${detail}</span></div>`;
  }).join('');
  container.innerHTML = rows;
  container.style.display = 'block';
}

function amzSt(m, c='') {
  const e = document.getElementById('amz-proc-st');
  e.textContent = m; e.className = 'pst ' + c;
}

// ─── Navegação ────────────────────────────────
function entryNewUploadAmazon() {
  document.getElementById('amazon-app').style.display          = 'block';
  document.getElementById('amz-result-screen').style.display   = 'none';
  document.getElementById('amz-upload-screen').style.display   = 'flex';
}

// ─── Upload dos arquivos ──────────────────────
function loadAmzFiles(evt) {
  const files = Array.from(evt.target.files);
  if (!files.length) return;
  amzRawFiles = [];
  let loaded = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const fileHash = buildAmzContentHash(text);
      amzRawFiles.push({ name: file.name, text, hash: fileHash });
      loaded++;
      if (loaded === files.length) {
        document.getElementById('uc-amz-settlement').classList.add('done');
        document.getElementById('fn-amz-settlement').textContent = '✓ ' + files.map(f=>f.name).join(', ');
        document.getElementById('cnt-amz-settlement').textContent = files.length > 1 ? files.length + ' arquivos' : '';
        document.getElementById('amz-proc-btn').disabled = false;
        amzSt('✓ ' + loaded + ' arquivo(s) prontos.', 'ok');
        renderAmzDedupSummary([]);
      }
    };
    reader.readAsText(file, 'utf-8');
  });
  evt.target.value = '';
}

// ─── Parse TSV linha a linha ──────────────────

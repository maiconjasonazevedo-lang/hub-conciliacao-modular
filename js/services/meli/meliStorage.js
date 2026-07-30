/**
 * services/meli/meliStorage.js
 * Estado e armazenamento dos arquivos Mercado Livre (SCA/EC), leitura
 * de arquivo e navegação da tela de upload ML.
 * Estado: MELI_FILES, MELI_DATA, meliPage, MELI_PS.
 * Funções: loadMeliFile, checkMeliReady, meliSt, goMeliBack.
 * Código movido sem alteração de lógica (seção original: MERCADO LIVRE
 * — FILE STORAGE & PARSE, parte de armazenamento).
 */

// ══════════════════════════════════════════════
// MERCADO LIVRE — FILE STORAGE & PARSE
// ══════════════════════════════════════════════
const MELI_FILES = { sca: null, ec: null };
let MELI_DATA = null;
let meliPage = 1;
const MELI_PS = 30;

function loadMeliFile(evt, key) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      // Tentar como xlsx normal primeiro
      let wb;
      try { wb = XLSX.read(e.target.result, { type: 'array', cellDates: true }); }
      catch(e2) { wb = null; }

      if (wb) {
        MELI_FILES[key] = { wb, name: file.name, raw: null };
      } else {
        // SpreadsheetML (XML disfarçado de xlsx)
        MELI_FILES[key] = { wb: null, name: file.name, raw: e.target.result };
      }
      document.getElementById('uc-ml-' + key).classList.add('done');
      document.getElementById('fn-ml-' + key).textContent = '✓ ' + file.name;
      checkMeliReady();
    } catch(err) { meliSt('Erro ao ler ' + file.name + ': ' + err.message, 'err'); }
  };
  reader.readAsArrayBuffer(file);
}

function checkMeliReady() {
  const ok = !!MELI_FILES.sca && !!MELI_FILES.ec;
  document.getElementById('meli-proc-btn').disabled = !ok;
  if (ok) meliSt('✓ Arquivos prontos.', 'ok');
}
function meliSt(m, c='') { const e=document.getElementById('meli-proc-st'); e.textContent=m; e.className='pst '+c; }
function goMeliBack() {
  document.getElementById('meli-result-screen').style.display = 'none';
  document.getElementById('meli-upload-screen').style.display = 'flex';
}

// Parse SCA (ODS/XLSX): header na linha 3, colunas: Pedido ML, Comissão ML, Comissão SCA, Nota, Situação, Emissão

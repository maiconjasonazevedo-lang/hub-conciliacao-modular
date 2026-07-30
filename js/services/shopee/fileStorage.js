/**
 * services/shopee/fileStorage.js
 * Armazenamento em memória dos arquivos carregados (income/svcFee/trans/
 * anymarket/orders), leitura de workbook e navegação da tela de upload.
 * Funções: loadFile, loadFileMulti, readWB, checkReady, setSt, goBack.
 * Depende de: nenhuma dependência de outros módulos além do DOM/XLSX (lib externa).
 * Código movido sem alteração de lógica (seção original: FILE STORAGE).
 */

// ══════════════════════════════════════════════
// FILE STORAGE
// ══════════════════════════════════════════════
const FILES = { income: null, trans: null, any: [], orders: null };

function loadFile(evt, key) {
  const file = evt.target.files[0];
  if (!file) return;
  readWB(file, wb => {
    FILES[key] = wb;
    document.getElementById('uc-'+key).classList.add('done');
    document.getElementById('fn-'+key).textContent = '✓ ' + file.name;
    // Se income, também usa como svcfee
    checkReady();
  });
}

function loadFileMulti(evt, key) {
  const files = Array.from(evt.target.files);
  if (!files.length) return;
  FILES[key] = [];
  let loaded = 0;
  files.forEach(file => {
    readWB(file, wb => {
      FILES[key].push({ wb, name: file.name });
      loaded++;
      if (loaded === files.length) {
        document.getElementById('uc-'+key).classList.add('done');
        document.getElementById('fn-'+key).textContent = '✓ ' + files.map(f=>f.name).join(', ');
        document.getElementById('cnt-'+key).textContent = files.length > 1 ? `${files.length} arquivos carregados` : '';
        checkReady();
      }
    });
  });
}

function readWB(file, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
      cb(wb);
    } catch(err) { setSt('Erro ao ler ' + file.name + ': ' + err.message, 'err'); }
  };
  reader.readAsArrayBuffer(file);
}

function checkReady() {
  const ok = !!FILES.income && !!FILES.trans;
  document.getElementById('proc-btn').disabled = !ok;
  if (ok) setSt('✓ Pronto para processar.', 'ok');
}
function setSt(m, c='') { const e=document.getElementById('proc-st'); e.textContent=m; e.className='pst '+c; }
function goBack() { document.getElementById('app-screen').style.display='none'; document.getElementById('upload-screen').style.display='flex'; }


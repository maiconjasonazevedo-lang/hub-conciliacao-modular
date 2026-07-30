/**
 * services/shopeeNF/shopeeNFOrdersReader.js
 * Leitura do arquivo Orders XLSX usado na Conciliação NF Shopee.
 * Estado: SNF_ORDERS_RAW.
 * Função: snfLoadOrders.
 * Código movido sem alteração de lógica (seção original: SHOPEE
 * CONCILIAÇÃO NF — leitura do Orders XLSX).
 */

// ══════════════════════════════════════════════
// SHOPEE CONCILIAÇÃO NF — leitura do Orders XLSX
// ══════════════════════════════════════════════
let SNF_ORDERS_RAW = null;

function snfLoadOrders(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  document.getElementById('snf-fn-orders').textContent = file.name;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, {defval:''});
      SNF_ORDERS_RAW = raw;
      document.getElementById('snf-proc-btn').disabled = false;
      document.getElementById('snf-proc-st').textContent = `✅ ${raw.length} pedidos carregados`;
    } catch(err) {
      alert('Erro ao ler Orders: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
  evt.target.value = '';
}


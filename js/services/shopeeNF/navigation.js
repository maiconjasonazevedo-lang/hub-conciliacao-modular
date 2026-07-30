/**
 * services/shopeeNF/navigation.js
 * Navegação de entrada da Conciliação NF Shopee.
 * Funções: openShopeeConciNF, snfNovoUpload.
 * Código movido sem alteração de lógica (seção original: SHOPEE
 * CONCILIAÇÃO NF — navegação).
 */

// ══════════════════════════════════════════════
// SHOPEE CONCILIAÇÃO NF — navegação
// ══════════════════════════════════════════════
function openShopeeConciNF() {
  document.getElementById('shopee-home').style.display    = 'none';
  document.getElementById('shopee-nf-app').style.display  = 'block';
  document.getElementById('snf-upload-screen').style.display = 'flex';
  document.getElementById('snf-result-screen').style.display = 'none';
}

function snfNovoUpload() {
  SNF = null;
  document.getElementById('snf-result-screen').style.display  = 'none';
  document.getElementById('snf-upload-screen').style.display  = 'flex';
  document.getElementById('snf-fn-orders').textContent = 'Nenhum arquivo';
  document.getElementById('snf-proc-btn').disabled = true;
  document.getElementById('snf-proc-st').textContent = '';
  // Limpar campos NF
  ['snf-nf-comissao','snf-nf-taxa-item','snf-nf-abat-comissao',
   'snf-nf-abat-opcionais','snf-nf-processamento','snf-nf-abat-proc'].forEach(id => {
    document.getElementById(id).value = '';
  });
}


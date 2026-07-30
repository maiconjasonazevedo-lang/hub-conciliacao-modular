/**
 * services/shopee/navigation.js
 * Navegação da Home Shopee (alterna entre fluxo de Conciliação e
 * Conciliação NF dentro do marketplace Shopee).
 * Funções: openShopeeConciSaque, goToShopeeHome.
 * Depende de: (nenhuma dependência de outros módulos além do DOM).
 * Código movido sem alteração de lógica (seção original: SHOPEE HOME NAVIGATION).
 */

// ══════════════════════════════════════════════
// SHOPEE HOME NAVIGATION
// ══════════════════════════════════════════════
function openShopeeConciSaque() {
  // Abre exatamente o fluxo original da Conciliação de Saque
  document.getElementById('shopee-home').style.display = 'none';
  document.getElementById('shopee-entry-screen').style.display = 'flex';
}

function goToShopeeHome() {
  document.getElementById('shopee-entry-screen').style.display = 'none';
  document.getElementById('shopee-app').style.display           = 'none';
  document.getElementById('shopee-nf-app').style.display        = 'none';
  document.getElementById('shopee-home').style.display          = 'flex';
}


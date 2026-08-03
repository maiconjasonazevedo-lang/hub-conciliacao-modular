/**
 * core/hub.js
 * Navegação principal do Hub — seleção de marketplace e retorno ao hub.
 * Código movido sem nenhuma alteração de lógica (seção original: HUB MARKETPLACE).
 */

// ══════════════════════════════════════════════
// HUB MARKETPLACE
// ══════════════════════════════════════════════
function selectMarketplace(mp) {
  if (mp === 'shopee') {
    document.getElementById('hub-screen').style.display = 'none';
    document.getElementById('shopee-home').style.display = 'flex';
    document.getElementById('hub-dev-msg').style.display = 'none';
  } else if (mp === 'meli') {
    document.getElementById('hub-screen').style.display = 'none';
    document.getElementById('meli-entry-screen').style.display = 'flex';
    document.getElementById('hub-dev-msg').style.display = 'none';
  } else if (mp === 'amazon') {
    document.getElementById('hub-screen').style.display = 'none';
    document.getElementById('amazon-app').style.display = 'block';
    document.getElementById('amz-result-screen').style.display = 'none';
    document.getElementById('amz-upload-screen').style.display = 'flex';
    document.getElementById('hub-dev-msg').style.display = 'none';
  } else {
    document.getElementById('hub-dev-msg').style.display = 'block';
  }
}

function renderAppVersion() {
  const version = window.APP_VERSION || {};
  const el = document.getElementById('hub-version');
  if (!el) return;
  const text = `${version.label || 'Hub Conciliação Modular'} · v${version.version || '—'} · build ${version.build || '—'} · ${version.buildDate || '—'}`;
  el.textContent = text;
}

function goToHub() {
  ['shopee-app','meli-app','amazon-app','shopee-entry-screen','meli-entry-screen','shopee-home','shopee-nf-app']
    .forEach(id => document.getElementById(id).style.display = 'none');
  document.getElementById('hub-screen').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', function () {
  renderAppVersion();
});


/**
 * services/meli/entryScreens.js
 * Telas de entrada da Conciliação Mercado Livre (carregar sessão
 * anterior, novo upload, ou tela vazia).
 * Funções: _hideAllMeli, _showMeliResult, entryLoadML, entryNewUploadML,
 * entryEmptyML.
 * Depende de: processMeli (services/meli/meliService.js), fBR/fBRsigned
 * (equivalentes locais definidos dentro deste próprio módulo ML, via
 * variáveis MELI_DATA) — mantido como no original.
 * Código movido sem alteração de lógica (seção original: ENTRY SCREENS
 * — Mercado Livre).
 */

// ══════════════════════════════════════════════
// ENTRY SCREENS — Mercado Livre
// ══════════════════════════════════════════════
function _hideAllMeli() {
  document.getElementById('meli-entry-screen').style.display = 'none';
  document.getElementById('meli-app').style.display           = 'none';
}

function _showMeliResult() {
  if (!MELI_DATA) MELI_DATA = { records: [], matchCount: 0 };
  MELI_DATA.records    = MELI_DATA.records    || [];
  MELI_DATA.matchCount = MELI_DATA.matchCount || 0;

  const records    = MELI_DATA.records;
  const matchCount = MELI_DATA.matchCount;
  const fml = v => 'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

  const totalComML  = records.reduce((s,r) => s + (r.comissaoML  || 0), 0);
  const totalComSCA = records.reduce((s,r) => s + (r.comissaoSCA || 0), 0);
  const totalComReal= records.filter(r=>r.hasEC).reduce((s,r) => s + (r.comissaoReal || 0), 0);
  const totalFrete  = records.filter(r=>r.hasEC).reduce((s,r) => s + (r.freteML      || 0), 0);
  const totalVlVenda= records.filter(r=>r.hasEC).reduce((s,r) => s + (r.vlVenda      || 0), 0);

  document.getElementById('meli-cards').innerHTML = `
    <div class="card yellow"><div class="card-lbl">Pedidos SCA</div><div class="card-val">${records.length}</div><div class="card-sub">${matchCount} com match EC</div></div>
    <div class="card orange"><div class="card-lbl">Vl Venda (EC)</div><div class="card-val">${fml(totalVlVenda)}</div><div class="card-sub">nos ${matchCount} com match</div></div>
    <div class="card red"><div class="card-lbl">Comissão ML Total</div><div class="card-val">${fml(totalComML)}</div></div>
    <div class="card green"><div class="card-lbl">ComissaoReal (EC)</div><div class="card-val">${fml(totalComReal)}</div><div class="card-sub">nos ${matchCount} com match</div></div>
    <div class="card blue"><div class="card-lbl">FreteML (EC)</div><div class="card-val">${fml(totalFrete)}</div><div class="card-sub">nos ${matchCount} com match</div></div>
    <div class="card"><div class="card-lbl">Comissão SCA Total</div><div class="card-val" style="color:var(--text-dim)">${fml(totalComSCA)}</div></div>`;

  const sits = [...new Set(records.map(r=>r.situacao).filter(Boolean))];
  const sitSel = document.getElementById('meli-sit');
  sitSel.innerHTML = '<option value="">Todas Situações</option>';
  sits.forEach(s => { const o=document.createElement('option');o.textContent=s;sitSel.appendChild(o); });

  meliPage = 1;
  buildMeliTable();

  // Exibir na ordem correta: app visível, upload oculto, result visível
  document.getElementById('meli-entry-screen').style.display  = 'none';
  document.getElementById('meli-app').style.display           = 'block';
  document.getElementById('meli-upload-screen').style.display = 'none';
  document.getElementById('meli-result-screen').style.display = 'block';
  document.getElementById('meli-period').textContent = `📅 ${records.length} pedidos · ${matchCount} cruzados`;
}

function entryLoadML(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      HIST_ML  = Array.isArray(parsed) ? parsed : (parsed.records || []);
      MELI_DATA = { records: HIST_ML, matchCount: HIST_ML.filter(r => r.hasEC).length };
      _showMeliResult();
    } catch(err) { alert('Erro ao ler JSON: ' + err.message); }
  };
  reader.readAsText(file, 'utf-8');
  evt.target.value = '';
}

function entryNewUploadML() {
  document.getElementById('meli-entry-screen').style.display  = 'none';
  document.getElementById('meli-app').style.display           = 'block';
  document.getElementById('meli-result-screen').style.display = 'none';
  document.getElementById('meli-upload-screen').style.display = 'flex';
}

function entryEmptyML() {
  MELI_DATA = { records: [], matchCount: 0 };
  _showMeliResult();
}


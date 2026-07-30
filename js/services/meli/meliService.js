/**
 * services/meli/meliService.js
 * Orquestração principal do processamento Mercado Livre.
 * Função: processMeli.
 * Depende de: MELI_FILES/MELI_DATA (services/meli/meliStorage.js),
 * parseSCA/parseEC (services/meli/meliParsers.js), meliSt
 * (services/meli/meliStorage.js), _showMeliResult (services/meli/entryScreens.js).
 * Código movido sem alteração de lógica (seção original: MERCADO LIVRE
 * — FILE STORAGE & PARSE, parte de processamento).
 */

function processMeli() {
  meliSt('⏳ Processando...', '');
  document.getElementById('meli-proc-btn').disabled = true;
  setTimeout(() => {
    try {
      const scaMap = parseSCA(MELI_FILES.sca);
      const ecMap  = parseEC(MELI_FILES.ec);

      // Cruzar: para cada pedido do SCA, buscar no EC por Pedido ML = PedidoMkt
      let matchCount = 0;
      Object.values(scaMap).forEach(row => {
        const ec = ecMap[row.pedidoML];
        if (ec) {
          row.notaEC        = ec.notaFiscal || '';
          row.dtEmissaoEC   = ec.dtEmissao  || '';
          row.dtPedidoEC    = ec.dtPedido   || '';
          row.vlVenda       = ec.vlVenda;
          row.vlComissao    = ec.vlComissao;
          row.despesaBase   = ec.despesaBase;
          row.despesaDesconto = ec.despesaDesconto;
          row.comissaoReal  = ec.comissaoReal;
          row.freteML       = ec.freteML;
          row.hasEC         = true;
          matchCount++;
        }
      });

      const records = Object.values(scaMap);
      const totalComML  = records.reduce((s,r) => s + r.comissaoML,  0);
      const totalComSCA = records.reduce((s,r) => s + r.comissaoSCA, 0);
      const totalComReal= records.filter(r=>r.hasEC).reduce((s,r) => s + r.comissaoReal, 0);
      const totalFrete  = records.filter(r=>r.hasEC).reduce((s,r) => s + r.freteML, 0);
      const totalVlVenda= records.filter(r=>r.hasEC).reduce((s,r) => s + r.vlVenda, 0);

      MELI_DATA = { records, scaMap, ecMap, matchCount };

      // Cards
      const fml = v => 'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
      document.getElementById('meli-cards').innerHTML = `
        <div class="card yellow"><div class="card-lbl">Pedidos SCA</div><div class="card-val">${records.length}</div><div class="card-sub">${matchCount} com match EC</div></div>
        <div class="card orange"><div class="card-lbl">Vl Venda (EC)</div><div class="card-val">${fml(totalVlVenda)}</div><div class="card-sub">nos ${matchCount} com match</div></div>
        <div class="card red"><div class="card-lbl">Comissão ML Total</div><div class="card-val">${fml(totalComML)}</div></div>
        <div class="card green"><div class="card-lbl">ComissaoReal (EC)</div><div class="card-val">${fml(totalComReal)}</div><div class="card-sub">nos ${matchCount} com match</div></div>
        <div class="card blue"><div class="card-lbl">FreteML (EC)</div><div class="card-val">${fml(totalFrete)}</div><div class="card-sub">nos ${matchCount} com match</div></div>
        <div class="card"><div class="card-lbl">Comissão SCA Total</div><div class="card-val" style="color:var(--text-dim)">${fml(totalComSCA)}</div></div>
      `;

      // Preencher filtro situação
      const sits = [...new Set(records.map(r=>r.situacao).filter(Boolean))];
      const sitSel = document.getElementById('meli-sit');
      sitSel.innerHTML = '<option value="">Todas Situações</option>';
      sits.forEach(s => { const o=document.createElement('option');o.textContent=s;sitSel.appendChild(o); });

      meliPage = 1;
      buildMeliTable();

      document.getElementById('meli-upload-screen').style.display = 'none';
      document.getElementById('meli-result-screen').style.display = 'block';
      document.getElementById('meli-period').textContent = `📅 ${records.length} pedidos · ${matchCount} cruzados`;
      meliSt(`✓ ${records.length} pedidos SCA · ${matchCount} com match EC · ${Object.keys(ecMap).length} pedidos no EC`, 'ok');
    } catch(err) {
      meliSt('❌ ' + err.message, 'err');
      document.getElementById('meli-proc-btn').disabled = false;
      console.error(err);
    }
  }, 60);
}

// ── TABELA ML ──

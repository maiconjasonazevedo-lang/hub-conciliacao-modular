/**
 * components/meli/MeliDashboard.js
 * Filtro e renderização da tabela de resultados Mercado Livre.
 * Funções: getMeliFilt, buildMeliTable.
 * Depende de: MELI_DATA, meliPage, MELI_PS (services/meli/meliStorage.js).
 * Código movido sem alteração de lógica (seção original: MERCADO LIVRE
 * — FILE STORAGE & PARSE, parte de tabela/render).
 */

function getMeliFilt() {
  const q   = document.getElementById('meli-q').value.toLowerCase();
  const sit = document.getElementById('meli-sit').value;
  const mat = document.getElementById('meli-match').value;
  return MELI_DATA.records.filter(r =>
    (!q   || r.pedidoML.includes(q) || r.nota.toLowerCase().includes(q)) &&
    (!sit || r.situacao === sit) &&
    (!mat || (mat==='com' && r.hasEC) || (mat==='sem' && !r.hasEC))
  );
}

function buildMeliTable() {
  if (!MELI_DATA) return;
  const data = getMeliFilt();
  document.getElementById('meli-cnt').textContent = data.length + ' pedidos';
  const page = data.slice((meliPage-1)*MELI_PS, meliPage*MELI_PS);
  const fml = v => v===0?'–':'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmlS = v => v===0?'–':(v<0?'-':'')+'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

  const th = document.querySelector('#meli-table thead');
  const tb = document.querySelector('#meli-table tbody');
  if (!th.innerHTML) th.innerHTML = `<tr>
    <th>Pedido ML</th><th>Emissão SCA</th><th>Nota SCA</th><th>Nota EC</th><th>Dt Emissão EC</th><th>Situação</th>
    <th class="tr">Comissão ML</th><th class="tr">Comissão SCA</th>
    <th class="tr">ComissaoReal</th><th class="tr">FreteML</th>
    <th class="tr">Vl Venda</th><th>Match</th>
  </tr>`;

  tb.innerHTML = page.length ? page.map(r => `<tr>
    <td class="mono" style="color:#f1c40f">${r.pedidoML}</td>
    <td class="mono" style="color:var(--text-dim);font-size:10.5px">${r.emissao}</td>
    <td class="mono" style="color:var(--blue)">${r.nota}</td>
    <td class="mono" style="color:var(--blue)">${r.notaEC||'–'}</td>
    <td class="mono" style="color:var(--text-dim);font-size:10.5px">${r.dtEmissaoEC||'–'}</td>
    <td style="font-size:10.5px;max-width:130px;overflow:hidden;text-overflow:ellipsis" title="${r.situacao}">${r.situacao||'–'}</td>
    <td class="mono tr ${r.comissaoML<0?'vneg':''}">${fmlS(r.comissaoML)}</td>
    <td class="mono tr">${fml(r.comissaoSCA)}</td>
    <td class="mono tr vpos">${r.hasEC?fml(r.comissaoReal):'–'}</td>
    <td class="mono tr vblu">${r.hasEC?fml(r.freteML):'–'}</td>
    <td class="mono tr">${r.hasEC?fml(r.vlVenda):'–'}</td>
    <td><span class="bdg ${r.hasEC?'bdg-fat':'bdg-pen'}">${r.hasEC?'✓ EC':'–'}</span></td>
  </tr>`).join('') : '<tr><td colspan="12" style="text-align:center;padding:30px;color:var(--text-muted)">Nenhum pedido encontrado</td></tr>';

  // Pagination
  const pg = Math.ceil(data.length/MELI_PS)||1;
  document.getElementById('meli-pag').innerHTML = `
    <span class="pinf">${Math.min((meliPage-1)*MELI_PS+1,data.length)}–${Math.min(meliPage*MELI_PS,data.length)} de ${data.length}</span>
    <button class="pbtn" ${meliPage<=1?'disabled':''} onclick="meliPage--;buildMeliTable()">‹</button>
    <span class="pinf">${meliPage}/${pg}</span>
    <button class="pbtn" ${meliPage>=pg?'disabled':''} onclick="meliPage++;buildMeliTable()">›</button>`;
}

// ── EXPORTAR ODS ML ──

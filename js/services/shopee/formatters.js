/**
 * services/shopee/formatters.js
 * Helpers de formatação de data/valor específicos do fluxo Shopee.
 * Funções/consts: parseDate, fmtDateBR, makeSaqLabel, round2, f, fBR,
 * fBRsigned, fn2, pct, bst, bsq, PS.
 * IMPORTANTE: assim como xlsxHelpers.js, este arquivo é usado somente
 * pelo fluxo Shopee. Amazon e Shopee NF possuem seus próprios
 * formatadores (amzN/amzFmtSigned, snfFmt/snfParseCurrency) que
 * permanecem intactos e separados para não alterar comportamento.
 * Código movido sem alteração de lógica (seções originais: DATE HELPERS
 * + início de DISPLAY).
 */

// ══════════════════════════════════════════════
// DATE HELPERS
// ══════════════════════════════════════════════
function parseDate(str) {
  if (!str) return null;
  // SheetJS com cellDates pode trazer Date object direto ou string
  if (str instanceof Date) return str;
  const s2 = String(str).trim();
  // "2026-03-23 08:48:32" ou "23/03/2026 08:48:32"
  let d = new Date(s2.replace(/(\d{2})\/(\d{2})\/(\d{4})/,'$3-$2-$1'));
  if (!isNaN(d)) return d;
  d = new Date(s2);
  return isNaN(d) ? null : d;
}

function fmtDateBR(d, mode='full') {
  if (!d) return '';
  const pad = n => String(n).padStart(2,'0');
  const date = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
  if (mode === 'date') return date;
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function makeSaqLabel(dataStr, valor) {
  const d = parseDate(dataStr);
  const datePart = d ? fmtDateBR(d,'date') : dataStr;
  const valPart = Math.abs(valor).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  return `Saque ${datePart} | R$ ${valPart}`;
}

function round2(v) { return Math.round(n(v)*100)/100; }

// ══════════════════════════════════════════════
// DISPLAY
// ══════════════════════════════════════════════
const f = v => { const x=parseFloat(v); if(isNaN(x)||x===0) return '–'; return 'R$ '+Math.abs(x).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); };
// fBR: sempre mostra o valor absoluto formatado em BR (sem sinal, para uso com sinal manual)
const fBR = v => { const x=parseFloat(v); if(isNaN(x)||x===0) return 'R$ 0,00'; return 'R$ '+Math.abs(x).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); };
// fBRsigned: mostra com sinal + ou -
const fBRsigned = v => { const x=parseFloat(v); if(isNaN(x)) return 'R$ 0,00'; const abs='R$ '+Math.abs(x).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); return x<0?'-'+abs:'+'+abs; };
const fn2 = v => { const x=parseFloat(v); return isNaN(x)?0:x; };
const pct = (a,b) => { const na=fn2(a),nb=fn2(b); if(!nb) return ''; return (Math.abs(na)/nb*100).toFixed(1)+'%'; };
const bst = st => { const m={'Faturado':'fat','Enviado':'fat','Cancelado':'can','Liberado':'lib','Pago':'fat'}; return `<span class="bdg bdg-${m[st]||'pen'}">${st||'–'}</span>`; };
const bsq = sq => (!sq||sq.includes('Futuro')) ? `<span class="bdg bdg-pen">A Liberar</span>` : `<span class="bdg bdg-saq">${sq.replace('Saque ','').split('|')[0].trim()}</span>`;
const PS = 25;


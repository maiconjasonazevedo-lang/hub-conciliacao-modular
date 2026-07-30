/**
 * services/shopeeNF/shopeeNFStorage.js
 * Estado e helpers de formatação/parsing da Conciliação NF Shopee.
 * Estado: SNF, SNF_ROWS, snfPage, SNF_PER_PAGE.
 * Funções: snfFmt, snfParseCurrency, snfNfVal.
 * IMPORTANTE: formatadores próprios do fluxo NF, independentes de
 * services/shopee/formatters.js (Conciliação Shopee normal) e de
 * services/amazon/amazonStorage.js.
 * Código movido sem alteração de lógica (seção original: SHOPEE
 * CONCILIAÇÃO NF — estado e helpers).
 */

// ══════════════════════════════════════════════
// SHOPEE CONCILIAÇÃO NF — estado e helpers
// ══════════════════════════════════════════════
let SNF = null;      // dados processados
let SNF_ROWS = [];   // linhas da tabela detalhada
let snfPage  = 1;
const SNF_PER_PAGE = 100;

function snfFmt(v) {
  return (v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function snfParseCurrency(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(/[^\d,.\-]/g,'').replace(',','.')) || 0;
}
function snfNfVal(id) {
  return Math.abs(snfParseCurrency(document.getElementById(id).value));
}


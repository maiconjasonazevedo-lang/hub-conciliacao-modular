/**
 * services/amazon/amazonErpV2ExportService.js
 * Exportação Excel da Conciliação Amazon ERP V2.
 * Função: exportErpV2Excel.
 * Depende de: AMZ_ERPV2_RESULT (components/amazon/AmazonErpV2Dashboard.js).
 * Código movido sem alteração de lógica (seção original: AMAZON ERP V2
 * — CONCILIAÇÃO SOBRE AMZ_ORDER_MAP, parte de exportação).
 */

function exportErpV2Excel() {
  if (typeof XLSX === 'undefined') {
    alert('Biblioteca de Excel não carregou. Verifique sua conexão com a internet e recarregue a página.');
    return;
  }
  if (!AMZ_ERPV2_RESULT || !AMZ_ERPV2_RESULT.length) {
    alert('Nenhum dado para exportar. Processe o settlement e o ERP primeiro.');
    return;
  }

  const statusTexto = s => ({
    'conciliado'    : 'Conciliado',
    'cancelado'     : 'Cancelado',
    'sem-settlement': 'Sem Settlement',
    'divergencia'   : 'Divergência',
  }[s] || s);

  const num = v => (v == null || v === '') ? 0 : Number(v);

  // Monta array de objetos — cada chave vira cabeçalho no Excel
  const rows = AMZ_ERPV2_RESULT.map(r => ({
    'Status'                  : statusTexto(r.status),
    'Pedido Marketplace'      : r.orderId                          || '',
    'Pedido Venda'            : r.pedidoVenda                      || '',
    'Nota Fiscal'             : r.notaFiscal                       || '',
    'Dt Emissão'              : r.dtEmissao || r.dtPedidoMarketplace || '',
    'Principal'               : num(r.principalGross),
    'Refund Principal'        : num(r.principalRefund),
    'Shipping'                : num(r.shippingGross),
    'Commission'              : num(r.commissionGross || r.commissionRefund),
    'Refund Commission'       : num(r.refundComm),
    'ShippingHB'              : num(r.shippingHBGross || r.shippingHBRefund),
    'Flex Fee'                : num(r.flexFeeGross    || r.flexFeeRefund),
    'DBA / Easy Ship'         : num(r.dba),
    'SAFE-T'                  : num(r.safeT),
    'Chargeback'              : num(r.chargeback),
    'Outros'                  : num(r.outros),
    'Qtd Eventos'             : r.qtdEventos                       || 0,
    'Settlement IDs'          : r.settlementIds                    || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Larguras de coluna
  ws['!cols'] = [
    {wch:16},{wch:26},{wch:16},{wch:14},{wch:13},
    {wch:14},{wch:14},{wch:14},
    {wch:14},{wch:14},{wch:14},
    {wch:14},{wch:14},{wch:14},
    {wch:14},{wch:14},{wch:14},
    {wch:14},{wch:14},{wch:14},
    {wch:14},{wch:10},{wch:16},{wch:18},{wch:12},{wch:10},{wch:10},{wch:30},
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Conciliação ERP V2');

  // Nome do arquivo com data atual
  const hoje = new Date();
  const dd   = String(hoje.getDate()).padStart(2,'0');
  const mm   = String(hoje.getMonth()+1).padStart(2,'0');
  const yyyy = hoje.getFullYear();
  XLSX.writeFile(wb, `conciliacao_erp_v2_${yyyy}${mm}${dd}.xlsx`);
}
// ── FIM exportErpV2Excel ──────────────────────────────────────────────────
// ── FIM MÓDULO AMAZON ──

// ── Tooltip viewport-safe ──────────────────────────────────────────────────
// Usa position:fixed calculado no mouseenter para nunca sair da viewport.
// Não altera nenhuma lógica existente — apenas posiciona o .tip-box.
(function () {
  const GAP    = 8;   // px entre o ícone e o balão
  const MARGIN = 10;  // margem mínima das bordas da viewport

  document.addEventListener('mouseenter', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const icon = e.target.closest('.tip-icon');
    if (!icon) return;
    const box = icon.querySelector('.tip-box');
    if (!box) return;

    // Renderiza o tooltip no body para evitar clipping e bordas de cartão
    if (!document.body.contains(box)) {
      document.body.appendChild(box);
      box.dataset.__portal = '1';
    }

    box.style.visibility = 'hidden';
    box.style.display    = 'block';
    box.style.top        = '0px';
    box.style.left       = '0px';
    box.style.bottom     = 'auto';
    box.style.right      = 'auto';

    const ir  = icon.getBoundingClientRect();
    const bw  = box.offsetWidth;
    const bh  = box.offsetHeight;
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;

    let left = ir.left + ir.width / 2 - bw / 2;
    let top  = ir.top - bh - GAP;

    if (left < MARGIN) left = MARGIN;
    if (left + bw > vw - MARGIN) left = vw - MARGIN - bw;

    if (top < MARGIN) {
      top = ir.bottom + GAP;
      box.dataset.below = '1';
    } else {
      delete box.dataset.below;
    }

    if (top + bh > vh - MARGIN) top = vh - MARGIN - bh;

    box.style.position = 'fixed';
    box.style.top = top + 'px';
    box.style.left = left + 'px';
    box.style.zIndex = '100000';
    box.style.visibility = 'visible';
  }, true);

  // Esconde ao sair do ícone (o CSS já faz via :hover, mas reset do style inline)
  document.addEventListener('mouseleave', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const icon = e.target.closest('.tip-icon');
    if (!icon) return;
    const box = icon.querySelector('.tip-box');
    if (!box) return;
    box.style.display = '';
    box.style.visibility = '';
  }, true);
})();
// ── FIM tooltip viewport-safe ──────────────────────────────────────────────


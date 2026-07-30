/**
 * services/shopee/processFiles.js
 * Orquestração principal do processamento dos arquivos Shopee.
 * Função: processFiles.
 * Depende de: parsers (services/shopee/parsers.js), setSt
 * (services/shopee/fileStorage.js), showApp (components/shopee/Dashboard.js),
 * makeSaqLabel/round2/fmtDateBR/parseDate (services/shopee/formatters.js).
 * Código movido sem alteração de lógica (seção original: PROCESS).
 */

// ══════════════════════════════════════════════
// PROCESS
// ══════════════════════════════════════════════
let D = null, pages = {tr:1,lb:1,nf2:1};

// FIX #3 — função única de cálculo de taxas, sempre base LÍQUIDA
// cb/sb são brutos (para Tarifa/ODS); cl/sl/txTrans/txItem/txR4/txAfil são líquidos (para totalTaxas)
function calcTaxas(cl, sl, txTrans, txItem, txR4, txAfil) {
  return round2(Math.abs(cl) + Math.abs(sl) + Math.abs(txTrans) + Math.abs(txItem) + Math.abs(txR4) + Math.abs(txAfil));
}

function processFiles() {
  setSt('⏳ Processando...','');
  document.getElementById('proc-btn').disabled = true;
  setTimeout(() => {
    try {
      const incomeRows = parseIncome(FILES.income);
      const svcMap = parseSvcFee(FILES.income);
      const transRows = parseTrans(FILES.trans);
      const anyMap = FILES.any.length ? parseAnymarket(FILES.any) : {};
      const ordMap = FILES.orders ? parseOrders(FILES.orders) : {};

      // Income map
      const incMap = {};
      incomeRows.forEach(r => { incMap[normalizeId(r['ID do pedido'])] = r; });

      // Saques
      const saques = transRows
        .filter(r => r.tipo === 'Saques')
        .map(r => {
          const d = parseDate(r.data);
          return { label: makeSaqLabel(r.data, r.valor), valor: Math.abs(r.valor), data: fmtDateBR(d,'date'), dataObj: d, ts: d ? d.getTime() : 0 };
        })
        .sort((a,b) => b.ts - a.ts);

      const saquesSorted = [...saques].sort((a,b) => a.ts - b.ts);
      function assignSaque(dataStr) {
        const dt = parseDate(dataStr);
        if (!dt) return 'Saque Futuro';
        const ts = dt.getTime();
        for (const sq of saquesSorted) { if (sq.ts >= ts) return sq.label; }
        return 'Saque Futuro';
      }

      // Build TRANS list — base do CSV, ordem do extrato (mais recente primeiro)
      const transDesc = [...transRows].sort((a,b) => {
        const ta = parseDate(a.data), tb = parseDate(b.data);
        return (tb?tb.getTime():0) - (ta?ta.getTime():0);
      });

      const transList = transDesc.map(t => {
        const pid = t.idPedido;
        const tipo = t.tipo;
        const isOrder = (tipo === 'Renda do pedido' || tipo === 'Ajuste') && !!pid;

        // FIX #4 — svc sempre seguro com optional chaining / fallback
        const svc = (pid && svcMap[pid]) ? svcMap[pid] : {};
        // FIX #6 — combina fontes: income tem precedência, mas complementa com ord/any
        const inc = pid ? (incMap[pid] || null) : null;
        const ord = pid ? (ordMap[pid] || null) : null;
        const any = pid ? (anyMap[pid] || null) : null;

        // Campo Pagamento: Ajuste e Saldo usa Descrição completa
        let pagamento = tipo;
        if (tipo === 'Ajuste' || tipo === 'Saldo da Carteira - Pagamento') pagamento = t.descricao;

        // FIX #1 e #3 — usar APENAS base líquida em totalTaxas; bruta apenas para Tarifa (ODS)
        let preco=0, freteComp=0, freteShop=0, freteParceiroLog=0, cb=0, sb=0, cl=0, sl=0;
        let txTrans=0, txItem=0, txR4=0, txAfil=0, pix=0, ajAC=0;
        let voucher=0, coinCashback=0, cupomShopeeInc=0;
        let hasFinancial = false;
        let semDados = false; // FIX #9 — flag para pedidos sem dados

        if (inc) {
          hasFinancial = true;
          preco          = n(inc['Preço do produto']);
          freteComp      = n(inc['Taxa de frete paga pelo comprador']);
          freteShop      = n(inc['Desconto de frete pela Shopee']);
          freteParceiroLog = n(inc['Frete cobrado pelo parceiro logístico']);
          cb        = Math.abs(n(inc['Taxa de comissão bruta']));
          sb        = Math.abs(n(inc['Taxa de serviço bruta']));
          cl        = Math.abs(n(inc['Taxa de comissão líquida']));
          sl        = Math.abs(n(inc['Taxa de serviço líquida']));
          pix       = n(inc['Ajuste por pagamento via PIX']);
          ajAC      = n(inc['Ajuste por participação em ação comercial']);
          // FIX #4 — svc seguro
          txTrans   = Math.abs(svc?.taxaTrans ?? 0);
          txItem    = Math.abs(svc?.taxaItem  ?? 0);
          txR4      = Math.abs(svc?.taxaR4    ?? 0);
          txAfil    = Math.abs(n(inc['Taxa de comissão Afiliados do Vendedor'] ?? 0));
          // campos extras CSV
          voucher   = n(inc['Voucher subsidiado pelo Seller']||0) + n(inc['Voucher compartilhado subsidiado pelo Seller']||0);
          coinCashback = n(inc['Coin Cashback subsidiado pelo Seller']||0) + n(inc['Coin Cashback compartilhado subsidiado pelo Seller']||0);
          cupomShopeeInc = n(inc['Cupom']||0);
          // FIX #6 — complementa preco com any se income vier zerado
          if (!preco && any) preco = any.valorProduto || 0;        } else if (ord) {
          hasFinancial = true;
          cb      = Math.abs(ord.comissaoBruta  || 0);
          sb      = Math.abs(ord.servicoBruto   || 0);
          cl      = Math.abs(ord.comissaoLiquida|| 0);
          sl      = Math.abs(ord.servicoLiquido || 0);
          txTrans = Math.abs(ord.taxaTrans      || 0);
          txAfil  = Math.abs(ord.txAfil         || 0);
          ajAC    = ord.ajusteAC || 0;
          preco   = (any && any.valorProduto) ? any.valorProduto : (ord.subtotal || 0);
          freteComp = 0;
          freteShop = 0;
        } else if (any && isOrder) {
          hasFinancial = true;
          preco = any.valorProduto || 0;
        } else if (isOrder) {
          // FIX #9 — pedido sem nenhuma fonte de dados financeiros
          semDados = true;
        }

        const nf = any ? any.nf : '';
        const produto = (inc ? s(inc['Nome do produto']) : (any ? any.produto : '')) || '';
        const saqLabel = isOrder ? assignSaque(t.data) : '';

        // FIX #1 e #3 — totalTaxas sempre base LÍQUIDA via função única
        const totalTaxas = calcTaxas(cl, sl, txTrans, txItem, txR4, txAfil);

        // FIX #7 — frete subsidiado: está em freteShop, incluído no valorSis via freteComp
        // valorSis = o que o comprador efetivamente originou (produto + frete comprador)
        // freteShop é o bônus Shopee, aparece separado

        // FIX #2 e #10 — receitaLiq = valor lançado (já é líquido no income) — não subtrair taxas de novo
        // Para income (released): t.valor JÁ é o valor líquido liberado após taxas
        // Para Ajustes: t.valor também já é o valor líquido do ajuste
        // totalTaxas serve para conferência/display, não para recalcular receita
        const receitaLiq = round2(t.valor); // valor do extrato É a receita líquida

        return {
          data: t.data,
          pagamento,
          valor: t.valor,
          pedido: pid || '-',
          status: t.direcao || (t.valor >= 0 ? 'Entrada' : 'Saída'),
          saldo: t.saldo,
          // Tarifa para CSV usa bruta (cb+sb), igual ao ODS
          tarifa:          hasFinancial ? round2(cb + sb) : null,
          valorSis:        hasFinancial ? round2(preco + freteComp) : null,
          valorMercadoria: hasFinancial ? preco : null,
          taxaEnvio:       hasFinancial ? freteComp : null,
          freteDesconto:   hasFinancial ? freteShop : null,
          provaRealDCC:    hasFinancial ? pix : null,
          tipo, produto: produto.substring(0,70),
          nf, cb, sb, cl, sl, txTrans, txItem, txR4, txAfil, ajAC, freteShop, freteParceiroLog, pix,
          voucher, coinCashback, cupomShopeeInc,
          // qtdItens: do income não temos direto, do ord temos
          qtdItens: (ord ? (ord.qtdItens || 1) : 1),
          moedasShopee: (ord ? (ord.moedasShopee || 0) : 0),
          cupomShopee: cupomShopeeInc || (ord ? (ord.cupomShopee || 0) : 0),
          desconto: voucher + coinCashback,
          // ajuste por ação comercial discriminado: diferença entre bruto e líquido
          ajusteComissao: round2(cb - cl),
          ajusteServico:  round2(sb - sl),
          totalTaxas, receitaLiq,
          saque: saqLabel, isOrder, hasFinancial, semDados,
        };
      });

      // Released = orders do income (Renda do pedido)
      const released = transList.filter(t => t.tipo === 'Renda do pedido' && t.isOrder);

      // Current = anymarket + orders, período novo
      const allCurrentIds = [...new Set([...Object.keys(anyMap), ...Object.keys(ordMap)])];
      const current = allCurrentIds.map(id => {
        const any = anyMap[id] || {};
        const ord = ordMap[id] || {};
        // FIX #1 — base líquida consistente
        const cl2     = Math.abs(ord.comissaoLiquida || 0);
        const sl2     = Math.abs(ord.servicoLiquido  || 0);
        const tt2     = Math.abs(ord.taxaTrans        || 0);
        const txAfil2 = Math.abs(ord.txAfil           || 0);
        // FIX #3 — mesma função calcTaxas
        const tt_total = calcTaxas(cl2, sl2, tt2, 0, 0, txAfil2);
        const tp = any.totalPedido || ord.totalGlobal || 0;
        return {
          pedido: id, status: any.status || ord.status || '',
          cliente: any.cliente || '', produto: any.produto || '',
          qtd: any.qtd || '1', valorProduto: any.valorProduto || 0,
          frete: any.frete || 0, totalPedido: tp,
          pagamento: any.pagamento || '', dataPedido: any.dataPedido || '',
          nf: any.nf || '', dataNF: any.dataNF || '',
          cb: Math.abs(ord.comissaoBruta || 0),
          sb: Math.abs(ord.servicoBruto  || 0),
          cl: cl2, sl: sl2,
          ajusteComissao: cl2 - Math.abs(ord.comissaoBruta || 0),
          ajusteServico:  sl2 - Math.abs(ord.servicoBruto  || 0),
          taxaTrans: tt2, txAfil: txAfil2, ajAC: ord.ajusteAC || 0,
          totalTaxas: tt_total,
          // FIX #2 — receita líquida = totalPedido - taxas líquidas
          receitaLiq: round2(tp - tt_total),
          saque: 'Saque Futuro (A Liberar)',
        };
      });

      const allDatas = transList.map(t => t.data).filter(Boolean).sort();
      const period = allDatas.length
        ? fmtDateBR(parseDate(allDatas[0]),'date') + ' – ' + fmtDateBR(parseDate(allDatas[allDatas.length-1]),'date')
        : '—';

      // FIX #9 — contar pedidos sem dados para aviso
      const semDadosCount = transList.filter(t => t.semDados).length;

      D = { transList, released, current, saques };
      const aviso = semDadosCount ? ` · ⚠️ ${semDadosCount} pedido(s) sem dados financeiros` : '';
      setSt(`✓ ${transList.length} transações · ${released.length} liberações · ${current.length} pedidos novos · ${Object.keys(anyMap).length} NFs mapeadas${aviso}`,'ok');
      showApp(period);
    } catch(err) {
      setSt('❌ ' + err.message,'err');
      document.getElementById('proc-btn').disabled = false;
      console.error(err);
    }
  }, 60);
}


/**
 * services/amazon/amazonService.js
 * Orquestração principal do processamento do Settlement Amazon.
 * Função: processAmazon.
 * Depende de: amzRawFiles (services/amazon/amazonStorage.js),
 * parseAmzTSV (services/amazon/amazonParsers.js), _showAmazonResult
 * (components/amazon/AmazonDashboard.js).
 * Código movido sem alteração de lógica (seção original: AMAZON —
 * MÓDULO, parte de processamento).
 */

function processAmazon() {
  if (!amzRawFiles.length && !AMZ_ERP_ORDERS.length) {
    amzSt('Carregue pelo menos um arquivo.', 'err'); return;
  }
  amzSt('Processando...', '');
  try {
    const importService = window.AmazonFileImportService;
    const indexService = window.AmazonIndexService;

    // 1. Processar arquivos através do novo pipeline com fallback para o parser legado.
    const allRows = [];
    const allSettlements = [];
    const txEvents = [];
    const importedFiles = [];
    const fileList = [];
    const dedupStatus = [];

    const settlementInputFiles = [];
    amzRawFiles.forEach(({ name, text, hash }) => {
      const fileImport = importService && typeof importService.createFileImport === 'function'
        ? importService.createFileImport(name, null, text)
        : null;
      const detectedType = importService && typeof importService.detectFileType === 'function'
        ? importService.detectFileType(text)
        : null;

      if (detectedType === importService.FILE_TYPES.TRANSACTION_REPORT && typeof window.parseAmazonTransactionReport === 'function') {
        const parsed = window.parseAmazonTransactionReport(text, { fileName: name });
        const events = parsed.events || [];
        txEvents.push(...events);
        importedFiles.push({ fileName: name, fileType: 'TRANSACTION_REPORT', parser: 'transaction-report' });
        fileList.push({ fileName: name, fileHash: hash || null, rows: events });
        if (fileImport) {
          fileImport.fileType = importService.FILE_TYPES.TRANSACTION_REPORT;
          fileImport.rowCount = events.length;
        }
        return;
      }

      if (detectedType === importService.FILE_TYPES.SETTLEMENT || detectedType === importService.FILE_TYPES.UNKNOWN) {
        settlementInputFiles.push({ name, text, hash });
      }
    });

    const settlementFileDescriptors = settlementInputFiles.map(file => ({
      fileName: file.name,
      fileHash: file.hash || buildAmzContentHash(file.text),
      rawFile: file,
    }));
    const dedupPlan = indexService && typeof indexService.groupFilesByHash === 'function'
      ? indexService.groupFilesByHash(settlementFileDescriptors)
      : { processedFiles: settlementFileDescriptors, ignoredFiles: [] };
    const processedSettlementFiles = (dedupPlan.processedFiles || []).map(entry => entry.rawFile).filter(Boolean);
    const ignoredSettlementFiles = (dedupPlan.ignoredFiles || []).map(entry => ({
      fileName: entry.ignored,
      originalName: entry.original,
      fileHash: entry.fileHash,
      status: 'ignored',
    }));

    processedSettlementFiles.forEach(({ name, text, hash }) => {
      const detectedType = importService && typeof importService.detectFileType === 'function'
        ? importService.detectFileType(text)
        : null;
      const fileImport = importService && typeof importService.createFileImport === 'function'
        ? importService.createFileImport(name, null, text)
        : null;

      if (detectedType === importService.FILE_TYPES.SETTLEMENT && typeof window.parseAmazonSettlement === 'function') {
        const parsed = window.parseAmazonSettlement(text, { fileName: name });
        const summary = parsed.summary || {};
        const normalizedRows = (parsed.rows || []).map(row => ({
          ...row,
          qty: row.quantity !== undefined ? row.quantity : (row.qty || ''),
          mktName: row.marketplaceName !== undefined ? row.marketplaceName : (row.mktName || ''),
          date: row.date || '',
          settlementId: row.settlementId || '',
          orderId: row.orderId || '',
          amount: typeof row.amount === 'number' ? row.amount : amzN(row.amount),
        }));
        const normalizedSummary = {
          id: summary.settlementId || summary.id || '',
          startDate: summary.settlementStartDate || summary.startDate || '',
          endDate: summary.settlementEndDate || summary.endDate || '',
          depositDate: summary.depositDate || '',
          totalAmount: summary.totalAmount || 0,
          fileName: name,
        };
        allSettlements.push(normalizedSummary);
        allRows.push(...normalizedRows);
        importedFiles.push({ fileName: name, fileType: 'SETTLEMENT', parser: 'settlement' });
        fileList.push({ fileName: name, fileHash: hash || null, rows: normalizedRows });
        dedupStatus.push({ fileName: name, fileHash: hash || null, status: 'processed' });
        if (fileImport) {
          fileImport.fileType = importService.FILE_TYPES.SETTLEMENT;
          fileImport.rowCount = normalizedRows.length;
        }
        return;
      }

      // Fallback legado para preservar o comportamento atual.
      const parsed = parseAmzTSV(text);
      if (!parsed) return;
      allSettlements.push(parsed.summary);
      allRows.push(...parsed.rows);
      importedFiles.push({ fileName: name, fileType: 'LEGACY_SETTLEMENT', parser: 'legacy' });
      fileList.push({ fileName: name, fileHash: hash || null, rows: parsed.rows });
      dedupStatus.push({ fileName: name, fileHash: hash || null, status: 'processed' });
      if (fileImport) {
        fileImport.fileType = 'LEGACY_SETTLEMENT';
        fileImport.rowCount = parsed.rows.length;
      }
    });

    const dedupSummary = [
      ...dedupStatus.map(item => ({ ...item, status: 'processed' })),
      ...ignoredSettlementFiles.map(item => ({ ...item, status: 'ignored' })),
    ];
    renderAmzDedupSummary(dedupSummary);

    AMZ_DATA = { rows: allRows, settlements: allSettlements };

    // 2. Montar mapa orderId → eventos
    AMZ_SETTLEMENT_MAP = buildSettlementMap(allRows);

    // 3. Cruzar com ERP se disponível
    AMZ_ERP_RESULT = AMZ_ERP_ORDERS.length
      ? crossErpSettlement(AMZ_ERP_ORDERS, AMZ_SETTLEMENT_MAP)
      : [];

    // 4. Exibir
    window.AMZ_IMPORT_SUMMARY = {
      importedFiles,
      txEventsCount: txEvents.length,
      settlementRowsCount: allRows.length,
      settlementFilesCount: allSettlements.length,
      usedNewPipeline: importedFiles.some(entry => entry.fileType === 'SETTLEMENT' || entry.fileType === 'TRANSACTION_REPORT')
    };

    if (indexService && typeof indexService.generateValidationReport === 'function') {
      const indexResult = indexService.generateValidationReport(txEvents, allRows, { fileList, log: false });
      window.AMZ_INDEX_REPORT = indexResult.report;
    }

    _showAmazonResult();
  } catch(err) {
    amzSt('Erro: ' + err.message, 'err');
    console.error(err);
  }
}

// ─── Exibir resultado ─────────────────────────

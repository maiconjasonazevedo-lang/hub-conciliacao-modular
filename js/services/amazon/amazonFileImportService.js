/**
 * services/amazon/amazonFileImportService.js
 * Serviço isolado de importação de arquivos Amazon.
 * Não integra o fluxo atual de amazonStorage.js neste momento.
 * Permite criar registros de importação, detectar tipo e validar estrutura.
 */
(function() {
  const ROOT = typeof window !== 'undefined' ? window : this;
  if (ROOT.AmazonFileImportService) return;

  const FILE_TYPES = {
    TRANSACTION_REPORT: 'TRANSACTION_REPORT',
    SETTLEMENT: 'SETTLEMENT',
    UNKNOWN: 'UNKNOWN',
  };

  const fileImports = [];
  let nextImportId = 1;

  function createFileImport(fileName, fileType, text) {
    const fileId = 'FI-' + Date.now() + '-' + (nextImportId++);
    const entry = {
      fileId,
      fileName: fileName || 'unknown',
      fileType: fileType || FILE_TYPES.UNKNOWN,
      text: text || '',
      importedAt: new Date().toISOString(),
      status: 'loaded',
      rowCount: 0,
      metadata: {},
    };
    fileImports.push(entry);
    return entry;
  }

  function getAllFileImports() {
    return fileImports.slice();
  }

  function detectFileType(text) {
    if (!text || typeof text !== 'string') return FILE_TYPES.UNKNOWN;
    const body = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const sampleLines = body.split('\n').slice(0, 8);
    const normalized = sampleLines.join(' ').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (normalized.includes('data/hora') || normalized.includes('id de liquidacao') || normalized.includes('status da transacao') || normalized.includes('date/time')) {
      return FILE_TYPES.TRANSACTION_REPORT;
    }
    if (normalized.includes('settlement-id') || normalized.includes('settlement-start-date') || (normalized.includes('tipo') && normalized.includes('order id')) || normalized.includes('rec bruta') || normalized.includes('liquido') ) {
      return FILE_TYPES.SETTLEMENT;
    }
    return FILE_TYPES.UNKNOWN;
  }

  function validateFileStructure(fileImport) {
    if (!fileImport || !fileImport.text) return { valid: false, errors: ['Arquivo vazio ou inválido.'] };
    const type = fileImport.fileType || detectFileType(fileImport.text);
    if (type === FILE_TYPES.TRANSACTION_REPORT) {
      if (typeof ROOT.parseAmazonTransactionReport !== 'function') {
        return { valid: false, errors: ['Parser de Transaction Report não está disponível.'] };
      }
      try {
        const result = ROOT.parseAmazonTransactionReport(fileImport.text, { fileName: fileImport.fileName });
        return { valid: true, errors: [], metadata: result.metadata };
      } catch (err) {
        return { valid: false, errors: ['Erro no parser: ' + err.message] };
      }
    }
    if (type === FILE_TYPES.SETTLEMENT) {
      if (typeof ROOT.parseAmazonSettlement !== 'function') {
        return { valid: false, errors: ['Parser de Settlement não está disponível.'] };
      }
      try {
        const result = ROOT.parseAmazonSettlement(fileImport.text, { fileName: fileImport.fileName });
        return { valid: true, errors: [], metadata: result.metadata };
      } catch (err) {
        return { valid: false, errors: ['Erro no parser: ' + err.message] };
      }
    }
    return { valid: false, errors: ['Tipo de arquivo não identificado.'] };
  }

  function generateInitialValidationReport({ transactionFile, settlementFiles }) {
    const report = {
      transaction: {
        fileName: transactionFile ? transactionFile.fileName : null,
        rowCount: 0,
        eventsCount: 0,
        settlementIds: [],
        orderIds: [],
        statusCount: {},
        duplicates: 0,
        inconsistencies: [],
      },
      settlements: {
        files: [],
        totalRows: 0,
        settlementIds: [],
        orderIds: [],
        inconsistencies: [],
      },
    };

    if (!transactionFile) {
      console.warn('Nenhum Transaction Report informado.');
      return report;
    }

    if (typeof ROOT.parseAmazonTransactionReport !== 'function') {
      throw new Error('parseAmazonTransactionReport não está disponível. Carregue amazonTransactionParsers.js.');
    }

    const txResult = ROOT.parseAmazonTransactionReport(transactionFile.text, { fileName: transactionFile.fileName });
    report.transaction.fileName = transactionFile.fileName;
    report.transaction.rowCount = txResult.rawRows.length;
    report.transaction.eventsCount = txResult.events.length;

    const settlementIdSet = new Set();
    const orderIdSet = new Set();
    const statusCount = {};
    const duplicateKeyMap = new Map();

    txResult.events.forEach(evt => {
      if (evt.settlementId) settlementIdSet.add(evt.settlementId);
      if (evt.orderId) orderIdSet.add(evt.orderId);
      const status = evt.transactionStatus || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
      const key = [evt.settlementId || '', evt.orderId || '', evt.transactionDate || '', evt.total || 0, evt.transactionType || '', evt.description || ''].join('|');
      duplicateKeyMap.set(key, (duplicateKeyMap.get(key) || 0) + 1);
      if (!evt.settlementId) report.transaction.inconsistencies.push({ type: 'missing_settlement_id', event: evt });
      if (!evt.transactionStatus) report.transaction.inconsistencies.push({ type: 'missing_transaction_status', event: evt });
      if (evt.invalidNumberFields && evt.invalidNumberFields.length) {
        report.transaction.inconsistencies.push({ type: 'invalid_number_fields', event: evt, fields: evt.invalidNumberFields });
      }
    });

    report.transaction.settlementIds = Array.from(settlementIdSet).sort();
    report.transaction.orderIds = Array.from(orderIdSet).sort();
    report.transaction.statusCount = statusCount;
    report.transaction.duplicates = Array.from(duplicateKeyMap.values()).filter(c => c > 1).reduce((sum, c) => sum + (c - 1), 0);

    if (Array.isArray(settlementFiles)) {
      settlementFiles.forEach(setFile => {
        if (typeof ROOT.parseAmazonSettlement !== 'function') {
          throw new Error('parseAmazonSettlement não está disponível. Carregue amazonSettlementParsers.js.');
        }
        const setResult = ROOT.parseAmazonSettlement(setFile.text, { fileName: setFile.fileName });
        const ids = new Set(setResult.rows.map(r => r.settlementId).filter(Boolean));
        const orders = new Set(setResult.rows.map(r => r.orderId).filter(Boolean));
          report.settlements.files.push({ fileName: setFile.fileName, rowCount: setResult.rows.length, settlementId: setResult.summary.settlementId, settlementStartDate: setResult.summary.settlementStartDate, settlementEndDate: setResult.summary.settlementEndDate, totalAmount: setResult.summary.totalAmount, uniqueSettlementIds: Array.from(ids), uniqueOrderIds: Array.from(orders) });
        report.settlements.totalRows += setResult.rows.length;
        ids.forEach(id => settlementIdSet.add(id));
        orders.forEach(id => orderIdSet.add(id));
        if (setResult.summary.settlementId === '' && setResult.summary.settlementStartDate === '' && setResult.summary.settlementEndDate === '') {
          report.settlements.inconsistencies.push({ type: 'missing_settlement_identity', fileName: setFile.fileName });
        }
      });
      report.settlements.settlementIds = Array.from(settlementIdSet).sort();
      report.settlements.orderIds = Array.from(orderIdSet).sort();
    }

    console.group('Amazon Initial Validation Report');
    console.log('Transaction Report:', report.transaction.fileName);
    console.log('  linhas processadas:', report.transaction.rowCount);
    console.log('  eventos gerados:', report.transaction.eventsCount);
    console.log('  settlementIds encontrados:', report.transaction.settlementIds.length, report.transaction.settlementIds);
    console.log('  pedidos encontrados:', report.transaction.orderIds.length);
    console.log('  status:', report.transaction.statusCount);
    console.log('  duplicidades detectadas:', report.transaction.duplicates);
    console.log('  inconsistências de transação:', report.transaction.inconsistencies.length);
    if (report.transaction.inconsistencies.length) console.log(report.transaction.inconsistencies.slice(0, 20));
    console.groupEnd();

    if (report.settlements.files.length) {
      console.group('Settlement Files');
      console.log('  arquivos processados:', report.settlements.files.length);
      console.log('  linhas totais do settlement:', report.settlements.totalRows);
      console.log('  settlementIds conhecidos:', report.settlements.settlementIds.length, report.settlements.settlementIds);
      console.log('  pedidos no settlement:', report.settlements.orderIds.length);
      console.log('  inconsistências de settlement:', report.settlements.inconsistencies.length);
      report.settlements.files.forEach(file => {
        console.log('   -', file.fileName, 'rows=', file.rowCount, 'settlementId=', file.settlementId, 'period=', file.settlementStartDate, '→', file.settlementEndDate, 'total=', file.totalAmount);
      });
      if (report.settlements.inconsistencies.length) console.log(report.settlements.inconsistencies);
      console.groupEnd();
    }

    return report;
  }

  ROOT.AmazonFileImportService = {
    FILE_TYPES,
    createFileImport,
    getAllFileImports,
    detectFileType,
    validateFileStructure,
    generateInitialValidationReport,
  };
})();

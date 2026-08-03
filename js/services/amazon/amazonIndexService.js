;(function(){
  'use strict'

  function makeMap() { return Object.create(null) }

  function indexBy(arr, keyFn) {
    const m = makeMap()
    for (const item of arr || []) {
      const k = keyFn(item)
      if (k == null) continue
      if (!m[k]) m[k] = []
      m[k].push(item)
    }
    return m
  }

  function signature(obj) {
    try { return JSON.stringify(obj) } catch (e) { return String(obj) }
  }

  function buildTransactionIndex(txEvents) {
    const byTxId = makeMap()
    const byOrderId = makeMap()
    const bySettlementId = makeMap()
    const sigSeen = makeMap()
    const duplicates = { byTxId: [], bySignature: [] }

    for (const ev of txEvents || []) {
      const txId = ev.transactionEventId || ev.id || null
      if (txId) {
        if (byTxId[txId]) duplicates.byTxId.push(txId)
        else byTxId[txId] = ev
      }

      const orderId = ev.orderId || ev.OrderID || null
      if (orderId) {
        (byOrderId[orderId] || (byOrderId[orderId] = [])).push(ev)
      }

      const settId = ev.settlementId || null
      if (settId) {
        (bySettlementId[settId] || (bySettlementId[settId] = [])).push(ev)
      }

      const sig = signature(ev)
      if (sigSeen[sig]) duplicates.bySignature.push(ev)
      else sigSeen[sig] = true
    }

    return { byTxId, byOrderId, bySettlementId, duplicates }
  }

  function buildSettlementIndex(settRows) {
    const byRowId = makeMap()
    const byOrderId = makeMap()
    const bySettlementId = makeMap()
    const sigSeen = makeMap()
    const duplicates = { byRowId: [], bySignature: [] }

    for (const r of settRows || []) {
      const rowId = r.settlementRowId || r.id || null
      if (rowId) {
        if (byRowId[rowId]) duplicates.byRowId.push(rowId)
        else byRowId[rowId] = r
      }

      const orderId = r.orderId || r.OrderID || null
      if (orderId) {
        (byOrderId[orderId] || (byOrderId[orderId] = [])).push(r)
      }

      const settId = r.settlementId || null
      if (settId) {
        (bySettlementId[settId] || (bySettlementId[settId] = [])).push(r)
      }

      const sig = signature(r)
      if (sigSeen[sig]) duplicates.bySignature.push(r)
      else sigSeen[sig] = true
    }

    return { byRowId, byOrderId, bySettlementId, duplicates }
  }

  function buildOrderIndex(txIndex, settIndex) {
    const orderMap = makeMap()
    const orderIds = new Set()
    for (const id of Object.keys(txIndex.byOrderId || {})) orderIds.add(id)
    for (const id of Object.keys(settIndex.byOrderId || {})) orderIds.add(id)

    for (const orderId of orderIds) {
      orderMap[orderId] = {
        orderId,
        transactionEvents: (txIndex.byOrderId[orderId] || []).slice(),
        settlementRows: (settIndex.byOrderId[orderId] || []).slice(),
        metadata: {}
      }
    }

    return orderMap
  }

  function groupFilesByHash(fileList) {
    // fileList: array of { fileName, fileHash? }
    const byHash = makeMap()
    for (const f of fileList || []) {
      const k = f.fileHash || null
      const key = k || f.fileName
      if (!key) continue
      if (!byHash[key]) byHash[key] = []
      byHash[key].push(f)
    }

    const duplicates = []
    const groups = {}
    const processedFiles = []
    const ignoredFiles = []
    for (const k of Object.keys(byHash)) {
      const group = byHash[k] || []
      if (!group.length) continue
      const original = group[0]
      processedFiles.push(original)
      if (group.length > 1) {
        duplicates.push(...group)
        groups[k] = group.map(x => ({ fileName: x.fileName, fileHash: x.fileHash || null }))
        for (let i = 1; i < group.length; i++) {
          ignoredFiles.push({ ignored: group[i].fileName, original: original.fileName, fileHash: group[i].fileHash || null })
        }
      }
    }
    return { duplicates, groups, processedFiles, ignoredFiles }
  }

  function detectFileDuplicates(fileList) {
    return groupFilesByHash(fileList)
  }

  function generateValidationReport(txEvents, settRows, options) {
    options = options || {}
    // If options.fileList contains per-file rows and hashes, use it to skip duplicate-content files
    let providedSettRowsCount = (settRows || []).length
    let processedSettRows = settRows || []
    const ignoredFiles = []
    const fileGroups = {}
    if (Array.isArray(options.fileList) && options.fileList.length > 0 && options.fileList[0].rows) {
      const dedup = groupFilesByHash(options.fileList)
      processedSettRows = []
      for (const original of dedup.processedFiles || []) {
        if (original.rows && original.rows.length) processedSettRows.push(...original.rows)
      }
      const groups = dedup.groups || {}
      Object.keys(groups).forEach(k => { fileGroups[k] = groups[k] })
      ignoredFiles.push(...(dedup.ignoredFiles || []))
      providedSettRowsCount = options.fileList.reduce((s,f)=> s + ((f.rows && f.rows.length) || 0), 0)
    }

    const txIndex = buildTransactionIndex(txEvents || [])
    const settIndex = buildSettlementIndex(processedSettRows || [])
    const orderIndex = buildOrderIndex(txIndex, settIndex)

    const uniqueTxCount = (txEvents || []).length
    const uniqueSettCount = providedSettRowsCount
    const processedSettCount = (processedSettRows || []).length
    const uniqueOrders = Object.keys(orderIndex).length
    const uniqueSettlementIds = Object.keys(settIndex.bySettlementId || {}).length
    const transactionOrderIds = Object.keys(txIndex.byOrderId || {})
    const settlementOrderIds = Object.keys(settIndex.byOrderId || {})
    const settlementOrderSet = new Set(settlementOrderIds)
    const ordersWithoutMatch = []
    const ordersSettlementCount = settlementOrderIds.length
    const ordersMatchedCount = transactionOrderIds.filter(oid => settlementOrderSet.has(oid)).length
    const ordersWithoutSettlementCount = transactionOrderIds.filter(oid => !settlementOrderSet.has(oid)).length
    for (const oid of Object.keys(orderIndex)) {
      const entry = orderIndex[oid]
      if ((!entry.transactionEvents || entry.transactionEvents.length === 0) && (!entry.settlementRows || entry.settlementRows.length === 0)) {
        ordersWithoutMatch.push(oid)
      }
    }

    const report = {
      uniqueTransactionEvents: uniqueTxCount,
      uniqueSettlementRows: uniqueSettCount,
      processedSettlementRowsCount: processedSettCount,
      uniqueOrders: uniqueOrders,
      uniqueSettlementIds: uniqueSettlementIds,
      ordersSettlementCount: ordersSettlementCount,
      ordersMatchedCount: ordersMatchedCount,
      ordersWithoutSettlementCount: ordersWithoutSettlementCount,
      ordersWithoutMatch: ordersWithoutMatch,
      duplicateTransactionEventIds: txIndex.duplicates.byTxId || [],
      duplicateTransactionSignatures: txIndex.duplicates.bySignature || [],
      duplicateSettlementRowIds: settIndex.duplicates.byRowId || [],
      duplicateSettlementSignatures: settIndex.duplicates.bySignature || [],
      fileDuplicates: detectFileDuplicates(options.fileList || []),
      // new fields about file-level processing
      providedSettlementRowsCount: providedSettRowsCount,
      processedSettlementRowsCount: (processedSettRows || []).length,
      ignoredFiles: ignoredFiles,
      fileGroups: fileGroups
    }

    // Print a readable console report
    if (options.log !== false) {
      console.log('=== Amazon Index Validation Report ===')
      console.log('TransactionEvents indexed:', report.uniqueTransactionEvents)
      console.log('SettlementRows indexed (loaded):', report.uniqueSettlementRows)
      console.log('SettlementRows indexed (processed after file dedup):', report.processedSettlementRowsCount)
      console.log('Unique orders found:', report.uniqueOrders)
      console.log('Unique settlementIds found:', report.uniqueSettlementIds)
      console.log('Orders with settlement rows:', report.ordersSettlementCount)
      console.log('Orders matched:', report.ordersMatchedCount)
      console.log('Orders without settlement:', report.ordersWithoutSettlementCount)
      console.log('Orders without match (sample 20):', report.ordersWithoutMatch.slice(0,20))
      console.log('Duplicate transaction IDs:', report.duplicateTransactionEventIds.length)
      console.log('Duplicate transaction signatures:', report.duplicateTransactionSignatures.length)
      console.log('Duplicate settlement row IDs:', report.duplicateSettlementRowIds.length)
      console.log('Duplicate settlement signatures:', report.duplicateSettlementSignatures.length)
      const fd = report.fileDuplicates
      if (fd && fd.duplicates) {
        console.log('Duplicate files detected (by name/hash):', fd.duplicates.length)
        console.log('Duplicate file groups (by hash):', report.fileGroups)
      } else {
        console.log('Duplicate files detected (by name/hash):', (report.fileDuplicates && report.fileDuplicates.length) || 0)
      }
      if (report.ignoredFiles && report.ignoredFiles.length) {
        console.log('Ignored files due to identical content:')
        console.log(report.ignoredFiles)
      }
      console.log('=======================================')
    }

    return { report, txIndex, settIndex, orderIndex }
  }

  const AmazonIndexService = {
    buildTransactionIndex,
    buildSettlementIndex,
    buildOrderIndex,
    groupFilesByHash,
    detectFileDuplicates,
    generateValidationReport
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = AmazonIndexService
  if (typeof window !== 'undefined') window.AmazonIndexService = AmazonIndexService

})()

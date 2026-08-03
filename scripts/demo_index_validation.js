// Demo runner for amazonIndexService
const path = require('path')
const svc = require(path.join('..','js','services','amazon','amazonIndexService.js'))

// Synthetic sample data (replace with real parsed arrays to run real validation)
const txEvents = [
  { transactionEventId: 't1', orderId: 'O-100', settlementId: 'S-1', amount: 10 },
  { transactionEventId: 't2', orderId: 'O-101', settlementId: 'S-1', amount: 5 },
  { transactionEventId: 't3', orderId: 'O-100', settlementId: 'S-2', amount: 7 },
  // duplicate by id
  { transactionEventId: 't2', orderId: 'O-101', settlementId: 'S-1', amount: 5 },
  // duplicate by signature
  { transactionEventId: 't4', orderId: 'O-102', settlementId: 'S-3', amount: 3 },
  { transactionEventId: 't5', orderId: 'O-102', settlementId: 'S-3', amount: 3 }
]

const settRows = [
  { settlementRowId: 'r1', orderId: 'O-100', settlementId: 'S-1', amount: 10 },
  { settlementRowId: 'r2', orderId: 'O-101', settlementId: 'S-1', amount: 5 },
  { settlementRowId: 'r3', orderId: 'O-103', settlementId: 'S-4', amount: 2 },
  // duplicate row id
  { settlementRowId: 'r2', orderId: 'O-101', settlementId: 'S-1', amount: 5 }
]

const fileList = [
  { fileName: 'tx-1.csv', fileHash: 'h1' },
  { fileName: 'sett-1.csv', fileHash: 'h2' },
  { fileName: 'tx-1-copy.csv', fileHash: 'h1' }
]

const res = svc.generateValidationReport(txEvents, settRows, { fileList })

console.log('\nFull report object:\n', JSON.stringify(res.report, null, 2))

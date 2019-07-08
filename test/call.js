const CKBCore = require('@nervosnetwork/ckb-sdk-core').default

console.log('ok')

const nodeUrl = 'http://localhost:8114'

const core = new CKBCore(nodeUrl)

const privateKey = require('../config.json').privateKey
const async = require('async')

const loadSystemCell = async () => {
    const systemCellInfo = await core.loadSystemCell()
    return systemCellInfo
}

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', reason.stack || reason)
    // Recommended: send the information to sentry.io
    // or whatever crash reporting service you use
})

const loadCallDataCell = async (tx) => {
    return core.rpc.getTransaction(tx)
}

loadCallDataCell("0xec6140660b9c3b01f758c8ceffafbd522a4d7268d3856077e90e7b7aeeca8bf8")
    .then(console.log)
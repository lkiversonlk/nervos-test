exports.init = () => {
    const CKBCore = require('@nervosnetwork/ckb-sdk-core').default
    const nodeUrl = 'http://localhost:8114'
    const core = new CKBCore(nodeUrl)
    return core
}
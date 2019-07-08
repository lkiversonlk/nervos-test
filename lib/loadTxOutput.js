exports.load = (core, txHash) => {
    return core.rpc.getTransaction(txHash)
}

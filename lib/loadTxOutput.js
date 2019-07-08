exports.load = (core, txHash) => {
    return core.rpc.getTransaction(txHash)
        .then(tx => {
            return tx.transaction.outputs
        })
}

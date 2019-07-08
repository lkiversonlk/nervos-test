exports.loadSystemInfo = (core) => {

    function _hash(a) {
        return core.rpc.paramsFormatter.toHash(a)
    }

    return core.loadSystemCell()
        .then(cell => {
            const ENCRYPT_CODE_HASH = _hash(cell.codeHash)
            const ENCRYPT_CELL = {
                blockHash: _hash(cell.outPoint.blockHash),
                cell: {
                    txHash: _hash(cell.outPoint.cell.txHash),
                    index: cell.outPoint.cell.index,
                }
            }

            return {
                CODE_HASH: ENCRYPT_CODE_HASH,
                SYSTEM_CELL: ENCRYPT_CELL
            }
        })
}
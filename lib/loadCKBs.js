const async = require('async')

function loadCKBs(codeHash, identifier, core) {
    const script = {
        codeHash,
        args: [identifier]
    }
    const lockHash = core.utils.lockScriptToHash(script)
    return core.rpc.getTipBlockNumber()
        .then(number => {
            const n = Math.ceil(number / 100)

            const unspentCells = []

            async.times(
                n,
                async (i) => {
                    const start = 100 * i
                    let end = 100 * (i + 1)
                    end = end > number ? number : end

                    if (start > end) {
                        return
                    } else {
                        return core.rpc.getCellsByLockHash(lockHash, start, end)
                            .then(cells => {
                                if (cells.length) {
                                    unspentCells.push(...cells)
                                }
                                return
                            })
                    }
                },
                (err) => {
                    if (err) {
                        return Promise.reject(err)
                    } else {
                        return unspentCells
                    }
                }
            )
        })
}

module.export = loadCKBs
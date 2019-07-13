const async = require('async')

function loadCKBs(codeHash, identifier, core) {
    const script = {
        codeHash,
        args: [identifier]
    }
    const lockHash = core.utils.lockScriptToHash(script)
    return core.rpc.getTipBlockNumber()
        .then(number => {

            console.log(`current block number is ${number}`)
            const n = Math.ceil(number / 100)

            const unspentCells = []

            return new Promise((r, j) => {
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
                                        console.log(`load ${cells.length} cells`)
                                        unspentCells.push(...cells)
                                    }
                                    return
                                })
                        }
                    },
                    (err) => {
                        if (err) {
                            j(err)
                        } else {
                            r(unspentCells)
                        }
                    }
                )
            })

        })
}

module.exports = {
    loadCKBs
}
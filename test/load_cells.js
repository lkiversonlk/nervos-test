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

loadSystemCell()
    .then(cell => {
        function _hash(a) {
            return core.rpc.paramsFormatter.toHash(a)
        }

        const ENCRYPT_CODE_HASH = _hash(cell.codeHash)

        const ENCRYPT_CELL = {
            blockHash: _hash(cell.outPoint.blockHash),
            cell: {
                txHash: _hash(cell.outPoint.cell.txHash),
                index: cell.outPoint.cell.index,
            }
        }

        const MyAddr = core.generateAddress(privateKey)

        console.log(MyAddr)

        const script = {
            codeHash: ENCRYPT_CODE_HASH,
            args: [`0x${MyAddr.idenfitier}`]
        }

        const lockHash = core.utils.lockScriptToHash(script)

        core.rpc.getTipBlockNumber()
            .then(number => {
                const n = Math.ceil(number / 100)

                const unspentCells = []
                async.times(n,
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
                                        console.log(`load ${start} to ${end}, with ${cells.length} cells`)
                                        unspentCells.push(...cells)
                                    }
                                    return
                                })
                        }
                    },
                    (err) => {
                        if (err) {
                            console.log(err)
                            throw err
                        } else {
                            console.log(`now we have ${unspentCells.length} groups`)
                            console.log(JSON.stringify(unspentCells))
                        }
                    })
            })
    })


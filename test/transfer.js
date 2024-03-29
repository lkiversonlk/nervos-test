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
                            // now we have the unspent cells


                            let capacity = 599000000000000
                            const dstIdentifier = `0x${MyAddr.idenfitier}`
                            console.log(dstIdentifier)

                            let current_capacity = 0
                            const inputs = []
                            for (let i = unspentCells.length - 1; i >= 0; i --) {
                                const cell = unspentCells[i]
                                inputs.push({
                                    previousOutput: cell.outPoint,
                                    since: '0',
                                    args: []
                                })
                                current_capacity += parseInt(cell.capacity)
                                console.log(current_capacity)
                            }

                            // capacity = current_capacity
                            if (current_capacity < capacity) {
                                throw `total capacity ${current_capacity} not enough for ${capacity}`
                            }

                            const changeOutput = {
                                capacity: 0,
                                lock: {
                                    codeHash: ENCRYPT_CODE_HASH,
                                    args: [`0x${MyAddr.idenfitier}`],
                                },
                                data: '0x'
                            }
                            if (current_capacity > capacity) {
                                changeOutput.capacity = (current_capacity - capacity).toString()
                            }

                            const outputs = []
                            if (changeOutput.capacity > 0) {
                                outputs.push(changeOutput)
                            }

                            const fs = require('fs')
                            const data = '0x' + (fs.readFileSync('./maintwo')).toString('hex')
                            outputs.push({
                                capacity: capacity.toString(),
                                lock: {
                                    codeHash: ENCRYPT_CODE_HASH,
                                    args: [dstIdentifier]
                                },
                                data: data
                            })

                            const witnesses = []
                            for (let i = 0; i < inputs.length; i ++) {
                                witnesses.push({
                                    data: [],
                                })
                            }
                            const tx = {
                                version: '0',
                                deps: [ENCRYPT_CELL],
                                inputs,
                                outputs,
                                witnesses
                            }

                            console.log(JSON.stringify(tx, null, 2))

                            core.signTransaction(MyAddr)(tx)
                                .then(signedTx => {
                                    console.log(signedTx)
                                    core.rpc.sendTransaction(signedTx)
                                        .then(console.log)
                                        .catch(err => {
                                            console.log(err)
                                        })
                                })
                        }
                    })
            })
    })


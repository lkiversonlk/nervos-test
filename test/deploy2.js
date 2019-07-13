const core = require('../lib/init').init()
const loadSys = require('../lib/systemcell')
const loadTx = require('../lib/loadTxOutput').load
const privateKey = require('../config.json').privateKey
const loadCKBs = require('../lib/loadCKBs')
const MyAddr = core.generateAddress(privateKey)

const identifier = `0x${MyAddr.idenfitier}`

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', reason.stack || reason)
    // Recommended: send the information to sentry.io
    // or whatever crash reporting service you use
})


function depolyLock(txHash) {
    loadSys.loadSystemInfo(core)
        .then(SYS => {
            const { CODE_HASH, SYSTEM_CELL } = SYS

            return core.rpc.getTransaction(txHash)
                .then(tx => {
                    // console.log(JSON.stringify(tx, null, 2))
                    const cells = tx.transaction.outputs
                    const blockHash = tx.txStatus.blockHash

                    let JSEngineCodeHash
                    let JSEngineCell
                    let JSEngineCelli

                    let JSCell
                    let JSCelli

                    let inputCell
                    let inputCelli

                    cells.forEach((cell, i) => {
                        if (cell.data === '0x') {
                            inputCell = cell
                            inputCelli = i
                        } else if (cell.capacity === '26912400000000') {
                            JSEngineCell = cell
                            JSEngineCelli = i
                            const s = core.utils.blake2b(32, null, null, core.utils.PERSONAL)
                            s.update(core.utils.hexToBytes(JSEngineCell.data.replace(/^0x/, '')))
                            JSEngineCodeHash = '0x' + s.digest('hex')
                            console.log(`js code hash is ${JSEngineCodeHash}`)
                        } else {
                            JSCell = cell
                            JSCelli = i
                            console.log(`js cell`)
                            console.log(JSCell)
                        }
                    })

                    //把input拆成两个
                    //其中一个lock script指向JS engine
                    const inputs = []
                    const outputs = []
                    const deps = []

                    inputs.push({
                        previousOutput: {
                            blockHash,
                            cell: {
                                txHash,
                                index: inputCelli.toString()
                            }
                        },
                        since: '0',
                    })

                    deps.push(SYSTEM_CELL)
                    const jsCapacity = 6000000000
                    const jsRefOutput = {
                        capacity: jsCapacity.toString(),
                        lock: {
                            codeHash: JSEngineCodeHash,
                            args: []
                        },
                        data: '0x'
                    }

                    const jsEngineDepCell = {
                        blockHash,
                        cell: {
                            txHash,
                            index: JSEngineCelli.toString()
                        }
                    }
                    deps.push(jsEngineDepCell)

                    const leftOutput = {
                        capacity: (parseInt(inputCell.capacity) - jsCapacity).toString(),
                        lock: {
                            codeHash: CODE_HASH,
                            args: [identifier]
                        },
                        data: '0x'
                    }

                    outputs.push(leftOutput)
                    outputs.push(jsRefOutput)

                    const toSubmit = {
                        version: '0',
                        inputs,
                        outputs,
                        deps,
                        witnesses: [{
                            data: []
                        }]
                    }

                    console.log(JSON.stringify(toSubmit, null, 2))
                    core.signTransaction(MyAddr)(toSubmit)
                        .then(signedTx => {
                            console.log(signedTx)
                            core.rpc.sendTransaction(signedTx)
                                .then(console.log)
                                .catch(err => {
                                    console.log(err)
                                })
                        })
                })
        })

}

//基于某一个transaction，拆分出两个
depolyLock(process.argv[2])
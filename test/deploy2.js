const core = require('../lib/init').init()
const loadSys = require('../lib/systemcell')
const loadTx = require('../lib/loadTxOutput').load
const privateKey = require('../config.json').privateKey
const loadCKBs = require('../lib/loadCKBs')
const MyAddr = core.generateAddress(privateKey)

const identifier = `0x${MyAddr.idenfitier}`

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
                            s.update(core.utils.hexToBytes(codeCell.data.replace(/^0x/, '')))
                            JSEngineCodeHash = s.digest('hex')
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
                        previouseOutput: {
                            blockHash,
                            cell: {
                                txhash,
                                index: inputCelli.toString()
                            }
                        },
                        since: '0',
                    })

                    deps.push(SYSTEM_CELL)
                    const jsCapacity = 6000000000
                    const jsRefOutput = {
                        capacty: jsCapacity.toString(),
                        lock: {
                            codeHash: JSEngineCodeHash,
                            args: []
                        },
                        data: '0x'
                    }

                    const leftOutput = {
                        capacty: (parseInt(inputCell.capacty) - jsCapacity).toString(),
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


depolyLock("0x2d10e052a69cf305c56d3e1a754735d7f77a8c77f62bb10b5f6cc702314c7974")
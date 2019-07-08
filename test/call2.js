const core = require('../lib/init').init()
const loadSys = require('../lib/systemcell')
const loadTx = require('../lib/loadTxOutput').load
const privateKey = require('../config.json').privateKey

const txHash = "0x395fc85dc84950ee394447418405e33413e3c0700e12d6e67c98452e797b0a3f"
const MyAddr = core.generateAddress(privateKey)
console.log(MyAddr)

const sender = `0x${MyAddr.idenfitier}`
loadSys.loadSystemInfo(core)
    .then(SYS => {
        const { CODE_HASH, SYSTEM_CELL } = SYS

        loadTx(core, txHash)
            .then(txData => {
                // get tx output
                console.log(JSON.stringify(txData, null, 2))

                const inputBlockHash = txData.txStatus.blockHash

                txData.transaction.outputs.forEach((cell, i) => {
                    // try to get back each cell

                    if (i !== 0) {
                        return
                    }

                    if (cell.capacity !== '60000000000') {
                        console.log(`jump cell with capacity ${cell.capacity}`)
                        return
                    }

                    const inputCell = {
                        previousOutput: {
                            blockHash: inputBlockHash,
                            cell: {
                                txHash: txHash,
                                index: i.toString()
                            }
                        },
                        since: '0',
                        args: [sender]
                    }

                    const outputCell = {
                        capacity: cell.capacity,
                        lock: {
                            codeHash: CODE_HASH,
                            args: [sender]
                        },
                        data: '0x'
                    }

                    const tx = {
                        version: '0',
                        deps: [SYSTEM_CELL],
                        inputs: [inputCell],
                        outputs: [outputCell],
                        witnesses: [{ data: [] }]
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
                })
            })
    })

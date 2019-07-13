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


// tx1: 0xe553d57acbaf228557a70a3a2c2e62af4420c7dcaf4e45fd31a1c5ff75278203
// block: 0x090d36583227c40ce705f826875fceee96f16cb8ce711b0de7f812bd165987fb
// [ 0: JS cell
//   1: JS Engine Cell
//   2: empty


// tx2: 0x97cdfc956d1131f82001fabd40d2bf15a2cdaab06a0b0ac4adbc6c782292f21f
// block: 0x9b92a5329397317372495c08f6a5071ada648cc504f9b2658cd8462d22fb664e
// [ 0: empty
//   1: ref cell
// ]

function tryUnlock() {
    const JSCell = {
        blockHash: "0x090d36583227c40ce705f826875fceee96f16cb8ce711b0de7f812bd165987fb",
        cell: {
            txHash: "0xe553d57acbaf228557a70a3a2c2e62af4420c7dcaf4e45fd31a1c5ff75278203",
            index: '0'
        }
    }

    const InputCell = {
        previousOutput: {
            blockHash: "0x9b92a5329397317372495c08f6a5071ada648cc504f9b2658cd8462d22fb664e",
            cell: {
                txHash: "0x97cdfc956d1131f82001fabd40d2bf15a2cdaab06a0b0ac4adbc6c782292f21f",
                index: '1'
            }
        },
        since: '0'
    }

    loadSys.loadSystemInfo(core)
        .then(SYS => {
            const { CODE_HASH, SYSTEM_CELL } = SYS

            const tx = {
                version: '0',
                inputs: [InputCell],
                deps: [JSCell],
                outputs: [{
                    capacity: '6000000000',
                    lock: {
                        codeHash: CODE_HASH,
                        args: [identifier]
                    },
                    data: '0x'
                }],
                witnesses: [{ data: []}]
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
}

tryUnlock()
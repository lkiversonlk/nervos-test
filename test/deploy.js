const core = require('../lib/init').init()
const loadSys = require('../lib/systemcell')
const loadTx = require('../lib/loadTxOutput').load
const privateKey = require('../config.json').privateKey
const loadCKBs = require('../lib/loadCKBs')
const MyAddr = core.generateAddress(privateKey)

const identifier = `0x${MyAddr.idenfitier}`

function deployData(data) {
    if (data.length === 0) {
        console.log(`data length is 0`)
        return
    }

    return loadSys.loadSystemInfo(core)
        .then(SYS => {
            const { CODE_HASH, SYSTEM_CELL } = SYS
            return loadCKBs.loadCKBs(CODE_HASH, identifier, core)
                .then(cells => {
                    let capacity = 0
                    const inputs = []
                    const witnesses = []

                    cells.forEach(cell => {
                        capacity += parseInt(cell.capacity)
                        inputs.push({
                            previousOutput: cell.outPoint,
                            since: '0'
                        })
                        witnesses.push({
                            data:[]
                        })
                    })
                    console.log(`total capacity is ${capacity}`)
                    const changed = {
                        capacity: 0,
                        lock: {
                            codeHash: CODE_HASH,
                            args: [identifier]
                        },
                        data: '0x'
                    }

                    let capacityNeeded = 0// 6000000000
                    const outputs = []

                    for (let i = 0; i < data.length; i ++) {
                        const d = data[i]
                        let cellCapacity = 6000000000
                        if (d.length > 2) {
                            cellCapacity += (100000000 * (d.length - 2)/2)
                        }
                        outputs.push({
                            capacity: cellCapacity.toString(),
                            lock: {
                                codeHash: CODE_HASH,
                                args: [identifier]
                            },
                            data: d
                        })
                        capacityNeeded += cellCapacity
                    }

                    if (capacity < capacityNeeded) {
                        return Promise.reject(`need capacity ${capacityNeeded}, but only have ${capacity}`)
                    }

                    const left = capacity - capacityNeeded
                    if (left > 0) {
                        changed.capacity = left.toString()
                        outputs.push(changed)
                    }

                    const tx = {
                        version: '0',
                        deps: [SYSTEM_CELL],
                        inputs,
                        outputs,
                        witnesses
                    }

                    console.log(JSON.stringify(tx, null, 4))

                    return core.signTransaction(MyAddr)(tx)
                        .then(signed => {
                            return core.rpc.sendTransaction(signed)
                        })
                })
        })
}

// const tryCapacity = parseInt(process.argv[2])
const fs = require('fs')
const data = []
for (let i = 0; i < process.argv.length - 2; i ++) {
    data[i] = '0x' + fs.readFileSync(process.argv[i + 2]).toString('hex')
}

deployData(data)
    .then(txhash => {
        console.log(txhash)
    })
    .catch(err => {
        console.log(err)
    })

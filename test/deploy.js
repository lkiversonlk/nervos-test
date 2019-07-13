const core = require('../lib/init').init()
const loadSys = require('../lib/systemcell')
const loadTx = require('../lib/loadTxOutput').load
const privateKey = require('../config.json').privateKey
const loadCKBs = require('../lib/loadCKBs')
const MyAddr = core.generateAddress(privateKey)

const identifier = `0x${MyAddr.idenfitier}`
console.log(`use capacity ${tryCapacity}`)
function deployData(data) {
    return loadSys.loadSystemInfo(core)
        .then(SYS => {
            const { CODE_HASH, SYSTEM_CELL } = SYS

            return loadCKBs.loadCKBs(CODE_HASH, identifier, core)
                .then(cells => {
                    console.log(cells)

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

                    let capacityNeeded = 6000000000

                    if (data.length > 2) {
                        capacityNeeded += (100000000 * (data.length - 2)/2)
                    }

                    if (capacity < capacityNeeded) {
                        return Promise.reject(`need capacity ${capacityNeeded}, but only have ${capacity}`)
                    }

                    const codeOutput = {
                        capacity: capacityNeeded.toString(),
                        lock: {
                            codeHash: CODE_HASH,
                            args: [identifier]
                        },
                        data
                    }

                    const left = capacity - capacityNeeded
                    const outputs = [codeOutput]

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
const data = process.argv[2]

deployData(data)
    .then(txhash => {
        console.log(txhash)
    })
    .catch(err => {
        console.log(err)
    })

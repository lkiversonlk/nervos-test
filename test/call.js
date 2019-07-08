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

const loadCallDataCell = async (tx) => {
    return core.rpc.getTransaction(tx)
        .then(txData => {
            return txData
        })
}

const txHash = "0xec6140660b9c3b01f758c8ceffafbd522a4d7268d3856077e90e7b7aeeca8bf8"
const MyAddr = core.generateAddress(privateKey)
console.log(MyAddr)
/**
 * 1. 获取需要的input cell，计算codeHash
 * 2. 构造两个output cell，lock script指向code hash，参数分别给不同个
 * 3. 两个生成的output cell，测试是否能解锁
 */

loadCallDataCell(txHash)
    .then(txData => {

        // 1. 获取input cell
        // 2. 需要cell的 { previousOutput: { block hash, cell { txHash, index } }, since, args }
        // 3. 构造 depCell { blockHash, cell: { txHash, index } }

        const cells = txData.transaction.outputs

        let codeCell, inputCell
        let codeIndex, inputIndex

        let inputCapacity
        cells.forEach((cell, i) => {
            if (cell.data !== '0x') {
                codeCell = cell
                codeIndex = i
            } else {
                inputCell = cell
                inputIndex = i
                inputCapacity = parseInt(inputCell.capacity)
            }
        })

        function _hash(a) {
            return core.rpc.paramsFormatter.toHash(a)
        }

        console.log(`load code cell ${JSON.stringify(codeCell)}:${codeIndex}, input cell ${JSON.stringify(inputCell)}:${inputIndex}, capacity ${inputCapacity}`)

        // construct the code hash
        const s = core.utils.blake2b(32, null, null, core.utils.PERSONAL)
        s.update(core.utils.hexToBytes(codeCell.data.replace(/^0x/, '')))
        const codeHash = s.digest('hex')

        console.log(`code hash is ${codeHash}`)

        const depCell = {
            blockHash: _hash(txData.txStatus.blockHash),
            cell: {
                txHash: _hash(txHash),
                index: codeIndex
            }
        }

        console.log(`depCell is ${JSON.stringify(depCell)}`)

        const inputCell = {
            previousOutput: {
                blockHash: _hash(txData.txStatus.blockHash),
                cell: {
                    txHash: _hash(txHash),
                    index: inputIndex
                }
            },
            since: '0',
            args: []
        }

        console.log(`input cell is ${JSON.stringify(inputCell)}`)

        //now we contract a 4 output cell with lockscript point to the same lock script with different args

        const minimum_capacity = 60 * (100000000)

        const outputCells = []
        const count = 5
        for(let i = 0; i < count; i ++) {
            const args = []

            for (let j = 0; j < i; j ++) {
                args.push('test')
            }

            const output = {
                capacity: minimum_capacity.toString(),
                lock: {
                    codeHash: _hash(codeHash),
                    args,
                }
            }

            outputCells.push(output)
        }

        const leftCapacity = inputCapacity - minimum_capacity * count

        core.loadSystemCell()
            .then(cell => {
                const ENCRYPT_CODE_HASH = _hash(cell.codeHash)
                const ENCRYPT_CELL = {
                    blockHash: _hash(cell.outPoint.blockHash),
                    cell: {
                        txHash: _hash(cell.outPoint.cell.txHash),
                        index: cell.outPoint.cell.index,
                    }
                }

                const changedOutput = {
                    capacity: leftCapacity.toString(),
                    lock: {
                        codeHash: ENCRYPT_CODE_HASH,
                        args: [`0x${MyAddr.idenfitier}`],
                    },
                    data: '0x'
                }

                outputCells.push(changedOutput)

                const depCells = [depCell, ENCRYPT_CELL]
                const inputCells = [inputCell]
                const witnesses = []
                for(let i = 0; i < inputCells.length; i ++ ) {
                    witnesses.push({ data: []})
                }

                const tx = {
                    version: '0',
                    deps: depCells,
                    inputs: inputCells,
                    outputs: outputCells,
                    witnesses
                }

                console.log(JSON.stringify(tx, null, 2))
            })
    })
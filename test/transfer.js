const CKBCore = require('@nervosnetwork/ckb-sdk-core').default

console.log('ok')

const nodeUrl = 'http://localhost:8114'

const core = new CKBCore(nodeUrl)

const privateKey = ""

const loadSystemCell = async () => {
    const systemCellInfo = await core.loadSystemCell()
    return systemCellInfo
}

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

        const MyAddr = code.generateAddress(privateKey)

        console.log(MyAddr)

        const script = {
            codeHash: ENCRYPT_CODE_HASH,
            args: [`0x${MyAddr.idenfitier}`]
        }
    })


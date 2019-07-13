const core = require('../lib/init').init()
const loadSys = require('../lib/systemcell')
const loadTx = require('../lib/loadTxOutput').load
const privateKey = require('../config.json').privateKey
const loadCKBs = require('../lib/loadCKBs')
const MyAddr = core.generateAddress(privateKey)

loadSys.loadSystemInfo(core)
.then(SYS => {
    const { CODE_HASH, SYSTEM_CELL } = SYS

    loadCKBs(CODE_HASH, `0x${MyAddr.idenfitier}`, core)
        .then(cells => {
            console.log(cells)
        })
})
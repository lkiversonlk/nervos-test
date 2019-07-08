const core = require('../lib/init').init()
const loadSys = require('../lib/systemcell')
const loadTx = require('../lib/loadTxOutput').load

const txHash = "0x395fc85dc84950ee394447418405e33413e3c0700e12d6e67c98452e797b0a3f"

loadSys.loadSystemInfo(core)
    .then(SYS => {
        const { CODE_HASH, SYSTEM_CELL } = SYS

        loadTx(core, txHash)
            .then(txData => {
                // get tx output
                console.log(JSON.stringify(txData, null, 2))
            })
    })

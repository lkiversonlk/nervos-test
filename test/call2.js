const core = require('../lib/init').init()
const loadSys = require('../lib/systemcell')

loadSys.loadSystemInfo(core)
    .then(SYS => {
        const { CODE_HASH, SYSTEM_CELL } = SYS

        
    })

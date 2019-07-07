const fs = require('fs')

const content = fs.readFileSync('./verify')

console.log(content.toString('hex'))
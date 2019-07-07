'use strict'
const toml = require('toml')
const json2toml = require('json2toml')
const concat = require('concat-stream')
const fs = require('fs')
const schedule = require('node-schedule')
const CKBCore = require('@nervosnetwork/ckb-sdk-core').default
//--------------------------------
const EC = require('elliptic').ec
const blake2b = require('blake2b-wasm')
const Address = require('@nervosnetwork/ckb-sdk-address').default
const { exec } = require('child_process')
//--------------------------------
const nodeUrl = 'http://localhost:8114'

const core = new CKBCore(nodeUrl)
const encoder = new TextEncoder(); // node version ≥ 11.0.0
const CKB_BLAKE_PERSONAL = encoder.encode('ckb-default-hash');


var number = 25000
var args = '0x94266d342cc9338dad46ac7e2cde6a3267194dfd'
var location = '../ckb/ckb-testnet/ckb.toml'
var scheduleJobTime = '* */1 * * * *'

function blake160(data, encode) {
    if (encode === void 0) {
        encode = 'binary';
    }

    var formattedData = typeof data === 'string' ? hexTo16Bytes(data) : data;
    var s = blake2b(32, null, null, CKB_BLAKE_PERSONAL);  // blake2b(digestLength, key, salt, personal)
    s.update(formattedData);
    return s.digest(encode).slice(0, encode === 'binary' ? 20 : 40);
};

function hexTo16Bytes(rawhex) {
    var hex = rawhex.toString(16);
    hex = hex.replace(/^0x/i, '');
    hex = hex.length % 2 ? "0" + hex : hex;
    var bytes = [];

    for (var c = 0; c < hex.length; c += 2) { // Uint16Array
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }

    return new Uint8Array(bytes);
};

//--------------------------------

function changefile(){
    var ec = new EC('secp256k1')
    var key = ec.genKeyPair()
    var address = new Address(key, {prefix: 'ckt'}) // the ckt is the signal for testnet
    console.log('地址更新:')
    console.log('privateKey: ', '0x' + address.getPrivateKey())
    console.log('publicKey: ', '0x' + address.publicKey)
    var blake160edPublicKey = blake160(address.publicKey, 'hex')
    var newargs = '0x' + blake160edPublicKey
    fs.createReadStream(location, 'utf8').pipe(concat(function(data) {
        var unparsed = toml.parse(data)
        unparsed.block_assembler.args[0] = newargs
        args = newargs
        console.log('blake160: ', newargs)
        var parsed = json2toml(unparsed)
        fs.writeFile(location, parsed,'utf8', function (err) {
            if (err) {

            }else{
                exec('pm2 restart ckb', (err, stdout, stderr) => {
                    if(err) {
                        console.log(err);
                        return;
                    }else{

                    }
                })
            }
        })
    }))
}

const  scheduleCronstyle = ()=>{
    //每分钟的第30秒定时执行一次:
    schedule.scheduleJob(scheduleJobTime, ()=>{
        core.rpc.getTipHeader().then((res)=>{
            var tip = res.number
            for ( let i = number + 1; i <= tip; i ++ ){
                core.rpc.getBlockByNumber(i).then((res)=>{
                    if(res.transactions[0].outputs[0].lock.args[0] === args){
                        changefile()
                    }else{
                        if(i == tip){console.log('check success: 未出块')}
                    }
                })
                number = i
            }
        })
    });
}

scheduleCronstyle()
const dgram = require('dgram')
const osc = require("osc-min")

/* ---------- UDP SERVER ---------- */

const server = dgram.createSocket('udp4')

server.on('error', (err) => {
    console.error(`UDP server error :\n${err.stack}`)
    server.close();
})

server.on('message', (msg, rinfo) => {
    let now = new Date()
    try {
        let bundle = osc.fromBuffer(msg)
        console.log(`[${now}] ${bundle.address} ${bundle.args.map(el => `${el.type}:${el.value}`).join(' ')}`)
    } catch(e) {
        console.error(`Not an OSC bundle : ${e.message}`)
        console.log(`[${now}] [RAW] ${msg}`)
    }
});

server.on('listening', () => {
    console.log(`UDP server listening`)
})

server.bind(53001)

function sendOsc(bundle,address,port){ return new Promise((resolve,reject) => {

    let buffer = osc.toBuffer(bundle)
    return server.send(buffer, 0, buffer.length, port, address,(err) => {
        if(err)
            return reject(err)
        return resolve()
    })

})}

/* ---------- USER MANAGEMENT ---------- */

function parseLine(line){

    let args = line.split(' ')
    let bundle = {
        address: args[0],
        args: []
    }

    args.splice(0,1)
    args.forEach( (el) => {
        let arg = el.split(':')
        switch(arg[0]){
            case 'i':
                bundle.args.push({type: 'integer', value: parseInt(arg[1])})
                break;
            case 's':
                bundle.args.push({type: 'string', value: arg[1]})
                break;
            case 'f':
                bundle.args.push({type: 'float', value: parseFloat(arg[1])})
                break;
            case 'b':
                if(arg[1] == "true")
                    bundle.args.push({type: 'true'})
                else
                    bundle.args.push({type: 'false'})
                break;
        }
    })

    return bundle
}

let commandBuffer = ""

process.stdin.on('data', (data) => {

    let dataLines = data.toString().split('\n')

    dataLines.forEach( (el,i) => {
        if(i == dataLines.length-1) {
            commandBuffer += el
            return
        }

        commandBuffer += el
        let mess = commandBuffer;
        commandBuffer = ""
        sendOsc(parseLine(mess),"127.0.0.1",53000)
    })

})
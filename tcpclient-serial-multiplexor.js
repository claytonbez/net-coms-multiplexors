//------------------------------------------------------
// ARGUMENT DEF
//------------------------------------------------------
var args = process.argv;
    args.slice(0,2);
var iPort = args.indexOf('--server-port');
var dPort = args[iPort + 1];
var iServer = args.indexOf('--server-address');
var dServer = args[iServer + 1];
var iCom = args.indexOf('--comport');
var dCom = args[iCom + 1];
var iBaud = args.indexOf('--baud');
var dBaud = parseInt(args[iBaud + 1]);
//------------------------------------------------------
// MODULE REQUIRES
//------------------------------------------------------
var colors = require('colors')
var net = require('net');
var serialport = require('serialport');
var moment = require('moment');
//------------------------------------------------------
// GLOBAL VAR
//------------------------------------------------------
var tcpSendBuffer = [];
var tcpHold = 0;
var serialSendBuffer = [];
var serialHold = 0 ;
var client = new net.Socket()
var tcpInterval;
var serialInterval;
var intervalConnect = false;
//------------------------------------------------------
// TCP CLIENT HANDLER
//------------------------------------------------------
client.on('connect', () => {
    clearIntervalConnect()
})
client.on('data', function (buffer) {
    var data = buffer.toString();
    tcpSendBuffer.push(data);
});
client.on('error', (err) => {
    console.log(err.code, 'TCP ERROR')
    launchIntervalConnect()
})
client.on('close', launchIntervalConnect)
client.on('end', launchIntervalConnect)
//------------------------------------------------------
// SERIAL POR HANDLER
//------------------------------------------------------
var sp = new serialport(dCom, { //use /dev/ttyS0 for linux
    baudrate: dBaud,
});
sp.on('open', () => {
    console.log('Serial Port Opened -->' + dBaud);
});
sp.on('data', serialdata => {
    serialSendBuffer.push(serialdata); //It's only job is to populate the buffer
});
sp.on('close', () => {
    console.log('Serial Port Closed.')
    clearInterval(serialInterval);
});
//------------------------------------------------------
// GLOBAL FUNCTIONS
//------------------------------------------------------

function startTcpBufferSendInterval() {
    console.log('TCP BUFFER ACTIVE'.cyan.bold)
    tcpInterval = setInterval(function () {
        if (tcpSendBuffer.length > 0 && tcpHold == false) {
            tcpHold = true;
            var cmd = tcpSendBuffer[0];
            var ts = moment().format('mm:ss:SS');
            // console.log(`TO SERIAL:${cmd} ${ts}`.cyan.bold)
            tcpSendBuffer.shift();
            sp.write(cmd);
            tcpHold = false;
        }
    }, 10); //checks every 100ms for new commands in the buffer
}

function startSerialBufferSendInterval() {
    console.log('SERIAL BUFFER ACTIVE'.yellow.bold)
    serialInterval = setInterval(function () {
        if (serialSendBuffer.length > 0 && serialHold == false) {
            serialHold = true;
            var cmd = serialSendBuffer[0];
            var ts = moment().format('mm:ss:SS');
            // console.log(`TO TCP SERVER:${cmd} ${ts}`.yellow.bold)
            serialSendBuffer.shift();
            client.write(cmd);
            serialHold = false;
        }
    },10); //checks every 100ms for new commands in the buffer
}

function connect() {
    client.connect({
        port: dPort,
        host: dServer
    })
}

function launchIntervalConnect() {
    if (false != intervalConnect) return
    intervalConnect = setInterval(connect, 5000)
}

function clearIntervalConnect() {
    if (false == intervalConnect) return
    clearInterval(intervalConnect)
    intervalConnect = false
}
//------------------------------------------------------
// INIT
//------------------------------------------------------
connect()
startSerialBufferSendInterval();
startTcpBufferSendInterval();
//------------------------------------------------------
// FINAL EXIT ERROR CATCH
//------------------------------------------------------
process.on('uncaughtException', function (err) {
    console.error(err);
    process.exit();
});